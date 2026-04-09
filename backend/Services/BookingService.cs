using System.Security.Cryptography;
using System.Text.Json;
using BookingSystem.Backend.Configuration;
using BookingSystem.Backend.Database;
using BookingSystem.Backend.Middleware;
using BookingSystem.Backend.Models;
using MySqlConnector;

namespace BookingSystem.Backend.Services;

public sealed class BookingService
{
    private readonly MySqlConnectionFactory _connectionFactory;
    private readonly AvailabilityService _availabilityService;
    private readonly StripeService _stripeService;
    private readonly EmailService _emailService;
    private readonly AppSettings _appSettings;
    private readonly StripeSettings _stripeSettings;
    private readonly ILogger<BookingService> _logger;

    public BookingService(
        MySqlConnectionFactory connectionFactory,
        AvailabilityService availabilityService,
        StripeService stripeService,
        EmailService emailService,
        AppSettings appSettings,
        StripeSettings stripeSettings,
        ILogger<BookingService> logger)
    {
        _connectionFactory = connectionFactory;
        _availabilityService = availabilityService;
        _stripeService = stripeService;
        _emailService = emailService;
        _appSettings = appSettings;
        _stripeSettings = stripeSettings;
        _logger = logger;
    }

    public async Task<IReadOnlyList<ServiceTypeDto>> GetServiceTypesAsync(CancellationToken cancellationToken = default)
    {
        var results = new List<ServiceTypeDto>();

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            SELECT id, duration_minutes, price_cents, name, name_zh, description, is_active, created_at, updated_at,
                   ROUND(price_cents / 100, 2) AS price
            FROM service_types
            WHERE is_active = TRUE
            ORDER BY id ASC;
            """,
            connection);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            results.Add(MapServiceType(reader));
        }

        return results;
    }

    public async Task<CreateBookingPaymentResponseDto> CreateBookingAsync(
        CreateBookingRequest request,
        CancellationToken cancellationToken = default)
    {
        var requestedSlots = ValidateAndNormalizeCreateBookingRequest(request);

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        try
        {
            var serviceType = await GetServiceTypeAsync(connection, transaction, request.ServiceTypeId, cancellationToken);
            if (serviceType is null)
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "Invalid service type");
            }

            var customerId = await FindOrCreateCustomerAsync(connection, transaction, request.Customer, cancellationToken);
            var bookingGroupToken = requestedSlots.Count > 1 ? GenerateManageToken() : null;
            var expiresAt = DateTime.Now.AddMinutes(30);
            var bookingIds = new List<int>(requestedSlots.Count);
            var totalPriceCents = 0;

            foreach (var slot in requestedSlots)
            {
                var durationMinutes = GetRequestedDurationMinutes(slot.StartTime, slot.EndTime);
                EnsureBookingDurationMatches(durationMinutes, slot.StartTime, slot.EndTime);
                if (durationMinutes != serviceType.DurationMinutes)
                {
                    throw new ApiException(
                        StatusCodes.Status400BadRequest,
                        $"Selected slot must match service duration of {serviceType.DurationMinutes} minutes");
                }

                await EnsureSlotIsAvailableAsync(
                    connection,
                    transaction,
                    slot.StartTime,
                    slot.EndTime,
                    durationMinutes,
                    cancellationToken);

                var bookingPriceCents = CalculateBookingPriceCents(serviceType.PriceCents, durationMinutes);
                var bookingId = await InsertPendingBookingAsync(
                    connection,
                    transaction,
                    customerId,
                    serviceType.Id,
                    slot.StartTime,
                    slot.EndTime,
                    durationMinutes,
                    bookingPriceCents,
                    request.Customer.Notes,
                    GenerateManageToken(),
                    bookingGroupToken,
                    expiresAt,
                    cancellationToken);

                bookingIds.Add(bookingId);
                totalPriceCents += bookingPriceCents;
            }

            var primaryBookingId = bookingIds[0];
            var totalDurationMinutes = requestedSlots.Sum(slot => GetRequestedDurationMinutes(slot.StartTime, slot.EndTime));

            var paymentIntent = await _stripeService.CreatePaymentIntentAsync(
                totalPriceCents,
                _stripeSettings.Currency,
                primaryBookingId,
                request.Customer.Email.Trim(),
                $"{serviceType.NameZh} 预约 #{primaryBookingId} ({requestedSlots.Count}个时段, 共{totalDurationMinutes}分钟)",
                cancellationToken);

            await InsertPendingPaymentAsync(connection, transaction, primaryBookingId, paymentIntent, cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new CreateBookingPaymentResponseDto
            {
                BookingId = primaryBookingId,
                ClientSecret = paymentIntent.ClientSecret,
                PublishableKey = _stripeService.PublishableKey,
                Amount = paymentIntent.Amount,
                Currency = paymentIntent.Currency,
                Status = paymentIntent.Status,
            };
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<BookingDetailsDto?> GetBookingByIdAsync(int bookingId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        return await GetBookingDetailsByPredicateAsync(
            connection,
            "b.id = @value",
            new MySqlParameter("@value", bookingId),
            cancellationToken);
    }

    public async Task<IReadOnlyList<BookingListItemDto>> GetAdminBookingsAsync(
        DateTime? startDate,
        DateTime? endDate,
        string? status,
        string? search,
        CancellationToken cancellationToken = default)
    {
        var results = new List<BookingListItemDto>();

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();

        var whereClauses = new List<string>();

        if (startDate.HasValue)
        {
            whereClauses.Add("b.start_time >= @startDate");
            command.Parameters.AddWithValue("@startDate", startDate.Value);
        }

        if (endDate.HasValue)
        {
            whereClauses.Add("b.start_time <= @endDate");
            command.Parameters.AddWithValue("@endDate", endDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            whereClauses.Add("(c.first_name LIKE @search OR c.last_name LIKE @search OR c.email LIKE @search OR c.phone LIKE @search)");
            command.Parameters.AddWithValue("@search", $"%{search.Trim()}%");
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalized = status.Trim().ToLowerInvariant();
            switch (normalized)
            {
                case "expired":
                    whereClauses.Add("b.status = 'pending' AND b.expires_at IS NOT NULL AND b.expires_at <= NOW() AND (p.status IS NULL OR p.status <> 'succeeded')");
                    break;
                case "pending":
                    whereClauses.Add("b.status = 'pending' AND (b.expires_at IS NULL OR b.expires_at > NOW() OR p.status = 'succeeded')");
                    break;
                default:
                    whereClauses.Add("b.status = @status");
                    command.Parameters.AddWithValue("@status", normalized);
                    break;
            }
        }

        var whereClause = whereClauses.Count > 0 ? $"WHERE {string.Join(" AND ", whereClauses)}" : string.Empty;
        command.CommandText = $"""
            SELECT
                b.id,
                b.start_time,
                b.end_time,
                b.status,
                b.expires_at,
                b.created_at,
                b.duration_minutes,
                ROUND(b.price_cents / 100, 2) AS price,
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                s.name_zh AS service_name,
                p.status AS payment_status,
                (
                    SELECT COUNT(*)
                    FROM booking_reschedule_requests rr
                    WHERE rr.booking_id = b.id AND rr.status = 'pending'
                ) AS pending_reschedule_requests
            FROM bookings b
            JOIN customers c ON b.customer_id = c.id
            JOIN service_types s ON b.service_type_id = s.id
            LEFT JOIN payments p ON b.id = p.booking_id
            {whereClause}
            ORDER BY b.start_time DESC;
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            results.Add(new BookingListItemDto
            {
                Id = reader.GetInt32("id"),
                CustomerName = $"{reader.GetString("first_name")} {reader.GetString("last_name")}",
                CustomerEmail = reader.GetString("email"),
                CustomerPhone = reader.GetString("phone"),
                ServiceName = reader.GetString("service_name"),
                DurationMinutes = reader.GetInt32("duration_minutes"),
                StartTime = reader.GetDateTime("start_time"),
                EndTime = reader.GetDateTime("end_time"),
                Status = GetEffectiveStatus(
                    reader.GetString("status"),
                    reader.GetNullableDateTime("expires_at"),
                    reader.GetNullableString("payment_status")),
                PaymentStatus = reader.GetNullableString("payment_status"),
                Price = reader.GetDecimal("price"),
                CreatedAt = reader.GetDateTime("created_at"),
                PendingRescheduleRequests = reader.GetInt32("pending_reschedule_requests"),
            });
        }

        return results;
    }

    public async Task<BookingAdminDetailDto?> GetAdminBookingByIdAsync(int bookingId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        return await GetAdminBookingByPredicateAsync(
            connection,
            "b.id = @value",
            new MySqlParameter("@value", bookingId),
            cancellationToken);
    }

    public async Task UpdateBookingStatusAsync(
        int bookingId,
        UpdateBookingStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var allowedStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "confirmed",
            "completed",
            "cancelled",
            "no_show",
        };

        if (!allowedStatuses.Contains(request.Status))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Unsupported booking status");
        }

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            UPDATE bookings
            SET status = @status,
                cancellation_reason = CASE WHEN @status = 'cancelled' THEN @reason ELSE cancellation_reason END,
                cancelled_at = CASE WHEN @status = 'cancelled' THEN NOW() ELSE cancelled_at END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @id;
            """,
            connection);
        command.Parameters.AddWithValue("@status", request.Status.Trim().ToLowerInvariant());
        command.Parameters.AddWithValue("@reason", request.CancellationReason);
        command.Parameters.AddWithValue("@id", bookingId);

        var affected = await command.ExecuteNonQueryAsync(cancellationToken);
        if (affected == 0)
        {
            throw new ApiException(StatusCodes.Status404NotFound, "Booking not found");
        }

        if (request.Status.Equals("cancelled", StringComparison.OrdinalIgnoreCase))
        {
            var booking = await GetAdminBookingByIdAsync(bookingId, cancellationToken);
            if (booking is not null)
            {
                await _emailService.SendBookingCancelledAsync(booking, cancellationToken);
            }
        }
    }

    public async Task<BookingAdminDetailDto> RescheduleBookingAsync(
        int bookingId,
        AdminRescheduleBookingRequest request,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        try
        {
            var booking = await GetBookingRecordAsync(connection, transaction, bookingId, cancellationToken);
            if (booking is null)
            {
                throw new ApiException(StatusCodes.Status404NotFound, "Booking not found");
            }

            EnsureRescheduleDurationMatches(booking.DurationMinutes, request.StartTime, request.EndTime);
            await EnsureSlotIsAvailableAsync(
                connection,
                transaction,
                request.StartTime,
                request.EndTime,
                booking.DurationMinutes,
                cancellationToken,
                bookingId);

            await using var updateCommand = new MySqlCommand(
                """
                UPDATE bookings
                SET start_time = @startTime,
                    end_time = @endTime,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = @id;
                """,
                connection,
                transaction);
            updateCommand.Parameters.AddWithValue("@startTime", request.StartTime);
            updateCommand.Parameters.AddWithValue("@endTime", request.EndTime);
            updateCommand.Parameters.AddWithValue("@id", bookingId);
            await updateCommand.ExecuteNonQueryAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        var updated = await GetAdminBookingByIdAsync(bookingId, cancellationToken)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Booking not found");
        await _emailService.SendBookingConfirmedAsync(updated, cancellationToken);
        return updated;
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);

        var today = DateTime.Today;
        var weekStart = today.AddDays(-(int)today.DayOfWeek);
        var monthStart = new DateTime(today.Year, today.Month, 1);

        var todayBookings = await ExecuteScalarIntAsync(
            connection,
            "SELECT COUNT(*) FROM bookings WHERE DATE(start_time) = CURDATE();",
            cancellationToken);
        var weekBookings = await ExecuteScalarIntAsync(
            connection,
            "SELECT COUNT(*) FROM bookings WHERE start_time >= @weekStart AND start_time < @weekEnd;",
            cancellationToken,
            new MySqlParameter("@weekStart", weekStart),
            new MySqlParameter("@weekEnd", weekStart.AddDays(7)));
        var monthRevenue = await ExecuteScalarDecimalAsync(
            connection,
            """
            SELECT COALESCE(ROUND(SUM(amount_cents) / 100, 2), 0)
            FROM payments
            WHERE status = 'succeeded'
              AND created_at >= @monthStart;
            """,
            cancellationToken,
            new MySqlParameter("@monthStart", monthStart));
        var customerCount = await ExecuteScalarIntAsync(connection, "SELECT COUNT(*) FROM customers;", cancellationToken);
        var pendingRescheduleRequests = await ExecuteScalarIntAsync(
            connection,
            "SELECT COUNT(*) FROM booking_reschedule_requests WHERE status = 'pending';",
            cancellationToken);

        var upcoming = new List<UpcomingBookingDto>();
        await using var command = new MySqlCommand(
            """
            SELECT
                b.id,
                c.first_name,
                c.last_name,
                s.name_zh AS service_name,
                b.start_time,
                b.status,
                b.expires_at,
                p.status AS payment_status
            FROM bookings b
            JOIN customers c ON b.customer_id = c.id
            JOIN service_types s ON b.service_type_id = s.id
            LEFT JOIN payments p ON p.booking_id = b.id
            WHERE b.start_time >= NOW()
              AND b.status NOT IN ('cancelled', 'completed', 'no_show')
              AND (
                    b.status <> 'pending'
                    OR b.expires_at IS NULL
                    OR b.expires_at > NOW()
                    OR p.status = 'succeeded'
                  )
            ORDER BY b.start_time ASC
            LIMIT 10;
            """,
            connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            upcoming.Add(new UpcomingBookingDto
            {
                Id = reader.GetInt32("id"),
                CustomerName = $"{reader.GetString("first_name")} {reader.GetString("last_name")}",
                ServiceName = reader.GetString("service_name"),
                StartTime = reader.GetDateTime("start_time"),
                Status = GetEffectiveStatus(
                    reader.GetString("status"),
                    reader.GetNullableDateTime("expires_at"),
                    reader.GetNullableString("payment_status")),
            });
        }

        return new DashboardStatsDto
        {
            TodayBookings = todayBookings,
            WeekBookings = weekBookings,
            MonthRevenue = monthRevenue,
            CustomerCount = customerCount,
            PendingRescheduleRequests = pendingRescheduleRequests,
            UpcomingBookings = upcoming,
        };
    }

    public async Task<IReadOnlyList<CustomerSummaryDto>> GetCustomersAsync(
        string? search,
        CancellationToken cancellationToken = default)
    {
        var results = new List<CustomerSummaryDto>();

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();

        var whereClause = string.Empty;
        if (!string.IsNullOrWhiteSpace(search))
        {
            whereClause = "WHERE c.first_name LIKE @search OR c.last_name LIKE @search OR c.email LIKE @search OR c.phone LIKE @search";
            command.Parameters.AddWithValue("@search", $"%{search.Trim()}%");
        }

        command.CommandText = $"""
            SELECT
                c.id,
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                COUNT(b.id) AS booking_count,
                MAX(b.start_time) AS last_booking_at,
                COALESCE(ROUND(SUM(CASE WHEN p.status = 'succeeded' THEN p.amount_cents ELSE 0 END) / 100, 2), 0) AS total_spent
            FROM customers c
            LEFT JOIN bookings b ON b.customer_id = c.id
            LEFT JOIN payments p ON p.booking_id = b.id
            {whereClause}
            GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.created_at
            ORDER BY last_booking_at DESC, c.created_at DESC;
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            results.Add(new CustomerSummaryDto
            {
                Id = reader.GetInt32("id"),
                FirstName = reader.GetString("first_name"),
                LastName = reader.GetString("last_name"),
                Email = reader.GetString("email"),
                Phone = reader.GetString("phone"),
                BookingCount = (int)reader.GetInt64("booking_count"),
                LastBookingAt = reader.GetNullableDateTime("last_booking_at"),
                TotalSpent = reader.GetDecimal("total_spent"),
            });
        }

        return results;
    }

    public async Task<CustomerDetailDto?> GetCustomerByIdAsync(int customerId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);

        CustomerDetailDto? detail = null;

        await using (var command = new MySqlCommand(
            """
            SELECT
                c.id,
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                c.created_at,
                COUNT(b.id) AS booking_count,
                COALESCE(ROUND(SUM(CASE WHEN p.status = 'succeeded' THEN p.amount_cents ELSE 0 END) / 100, 2), 0) AS total_spent
            FROM customers c
            LEFT JOIN bookings b ON b.customer_id = c.id
            LEFT JOIN payments p ON p.booking_id = b.id
            WHERE c.id = @id
            GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.created_at
            LIMIT 1;
            """,
            connection))
        {
            command.Parameters.AddWithValue("@id", customerId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                detail = new CustomerDetailDto
                {
                    Id = reader.GetInt32("id"),
                    FirstName = reader.GetString("first_name"),
                    LastName = reader.GetString("last_name"),
                    Email = reader.GetString("email"),
                    Phone = reader.GetString("phone"),
                    CreatedAt = reader.GetDateTime("created_at"),
                    BookingCount = (int)reader.GetInt64("booking_count"),
                    TotalSpent = reader.GetDecimal("total_spent"),
                };
            }
        }

        if (detail is null)
        {
            return null;
        }

        var bookings = new List<BookingListItemDto>();
        await using (var command = new MySqlCommand(
            """
            SELECT
                b.id,
                b.start_time,
                b.end_time,
                b.status,
                b.expires_at,
                b.created_at,
                b.duration_minutes,
                ROUND(b.price_cents / 100, 2) AS price,
                s.name_zh AS service_name,
                p.status AS payment_status,
                (
                    SELECT COUNT(*)
                    FROM booking_reschedule_requests rr
                    WHERE rr.booking_id = b.id AND rr.status = 'pending'
                ) AS pending_reschedule_requests
            FROM bookings b
            JOIN service_types s ON b.service_type_id = s.id
            LEFT JOIN payments p ON p.booking_id = b.id
            WHERE b.customer_id = @customerId
            ORDER BY b.start_time DESC;
            """,
            connection))
        {
            command.Parameters.AddWithValue("@customerId", customerId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                bookings.Add(new BookingListItemDto
                {
                    Id = reader.GetInt32("id"),
                    CustomerName = $"{detail.FirstName} {detail.LastName}",
                    CustomerEmail = detail.Email,
                    CustomerPhone = detail.Phone,
                    ServiceName = reader.GetString("service_name"),
                    DurationMinutes = reader.GetInt32("duration_minutes"),
                    StartTime = reader.GetDateTime("start_time"),
                    EndTime = reader.GetDateTime("end_time"),
                    Status = GetEffectiveStatus(
                        reader.GetString("status"),
                        reader.GetNullableDateTime("expires_at"),
                        reader.GetNullableString("payment_status")),
                    PaymentStatus = reader.GetNullableString("payment_status"),
                    Price = reader.GetDecimal("price"),
                    CreatedAt = reader.GetDateTime("created_at"),
                    PendingRescheduleRequests = reader.GetInt32("pending_reschedule_requests"),
                });
            }
        }

        return new CustomerDetailDto
        {
            Id = detail.Id,
            FirstName = detail.FirstName,
            LastName = detail.LastName,
            Email = detail.Email,
            Phone = detail.Phone,
            CreatedAt = detail.CreatedAt,
            BookingCount = detail.BookingCount,
            TotalSpent = detail.TotalSpent,
            Bookings = bookings,
        };
    }

    public async Task<ManagedBookingDto?> GetBookingByManageTokenAsync(
        string token,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        var booking = await GetAdminBookingByPredicateAsync(
            connection,
            "b.manage_token = @value",
            new MySqlParameter("@value", token),
            cancellationToken);

        if (booking is null)
        {
            return null;
        }

        return new ManagedBookingDto
        {
            BookingId = booking.Id,
            Status = booking.Status,
            PaymentStatus = booking.PaymentStatus,
            CustomerName = booking.CustomerName,
            CustomerEmail = booking.CustomerEmail,
            CustomerPhone = booking.CustomerPhone,
            ServiceName = booking.ServiceName,
            DurationMinutes = booking.DurationMinutes,
            Price = booking.Price,
            StartTime = booking.StartTime,
            EndTime = booking.EndTime,
            SupportEmail = _appSettings.SupportEmail,
            CanRequestReschedule = booking.Status is "confirmed" or "pending",
            RescheduleRequests = booking.RescheduleRequests,
        };
    }

    public async Task<RescheduleRequestDto> CreateRescheduleRequestAsync(
        string token,
        CreateRescheduleRequestInput request,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        try
        {
            var booking = await GetBookingRecordByTokenAsync(connection, transaction, token, cancellationToken);
            if (booking is null)
            {
                throw new ApiException(StatusCodes.Status404NotFound, "Booking not found");
            }

            if (booking.Status is "cancelled" or "completed" or "no_show")
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "This booking can no longer be rescheduled");
            }

            EnsureRescheduleDurationMatches(booking.DurationMinutes, request.RequestedStartTime, request.RequestedEndTime);
            await EnsureSlotIsAvailableAsync(
                connection,
                transaction,
                request.RequestedStartTime,
                request.RequestedEndTime,
                booking.DurationMinutes,
                cancellationToken,
                booking.Id);

            var pendingExists = await ExecuteScalarIntAsync(
                connection,
                "SELECT COUNT(*) FROM booking_reschedule_requests WHERE booking_id = @bookingId AND status = 'pending';",
                cancellationToken,
                transaction,
                new MySqlParameter("@bookingId", booking.Id));
            if (pendingExists > 0)
            {
                throw new ApiException(StatusCodes.Status409Conflict, "There is already a pending reschedule request for this booking");
            }

            await using var insertCommand = new MySqlCommand(
                """
                INSERT INTO booking_reschedule_requests
                    (booking_id, requested_start_time, requested_end_time, status, customer_note)
                VALUES
                    (@bookingId, @startTime, @endTime, 'pending', @customerNote);
                """,
                connection,
                transaction);
            insertCommand.Parameters.AddWithValue("@bookingId", booking.Id);
            insertCommand.Parameters.AddWithValue("@startTime", request.RequestedStartTime);
            insertCommand.Parameters.AddWithValue("@endTime", request.RequestedEndTime);
            insertCommand.Parameters.AddWithValue("@customerNote", request.CustomerNote);
            await insertCommand.ExecuteNonQueryAsync(cancellationToken);

            var requestId = (int)insertCommand.LastInsertedId;
            await transaction.CommitAsync(cancellationToken);

            var createdRequest = await GetRescheduleRequestByIdAsync(requestId, cancellationToken);
            var managedBooking = await GetBookingByManageTokenAsync(token, cancellationToken)
                ?? throw new ApiException(StatusCodes.Status404NotFound, "Booking not found");

            await _emailService.SendRescheduleRequestedAsync(managedBooking, createdRequest, cancellationToken);
            return createdRequest;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<RescheduleRequestDto> ApproveRescheduleRequestAsync(
        int requestId,
        string? adminNote,
        CancellationToken cancellationToken = default)
    {
        BookingAdminDetailDto? updatedBooking;
        RescheduleRequestDto updatedRequest;

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        try
        {
            var request = await GetRescheduleRequestRecordAsync(connection, transaction, requestId, cancellationToken);
            if (request is null)
            {
                throw new ApiException(StatusCodes.Status404NotFound, "Reschedule request not found");
            }

            if (!request.Status.Equals("pending", StringComparison.OrdinalIgnoreCase))
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "Reschedule request has already been reviewed");
            }

            var booking = await GetBookingRecordAsync(connection, transaction, request.BookingId, cancellationToken)
                ?? throw new ApiException(StatusCodes.Status404NotFound, "Booking not found");

            EnsureRescheduleDurationMatches(booking.DurationMinutes, request.RequestedStartTime, request.RequestedEndTime);
            await EnsureSlotIsAvailableAsync(
                connection,
                transaction,
                request.RequestedStartTime,
                request.RequestedEndTime,
                booking.DurationMinutes,
                cancellationToken,
                booking.Id);

            await using (var updateBooking = new MySqlCommand(
                """
                UPDATE bookings
                SET start_time = @startTime,
                    end_time = @endTime,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = @bookingId;
                """,
                connection,
                transaction))
            {
                updateBooking.Parameters.AddWithValue("@startTime", request.RequestedStartTime);
                updateBooking.Parameters.AddWithValue("@endTime", request.RequestedEndTime);
                updateBooking.Parameters.AddWithValue("@bookingId", request.BookingId);
                await updateBooking.ExecuteNonQueryAsync(cancellationToken);
            }

            await using (var updateRequest = new MySqlCommand(
                """
                UPDATE booking_reschedule_requests
                SET status = 'approved',
                    admin_note = @adminNote,
                    reviewed_at = NOW()
                WHERE id = @id;
                """,
                connection,
                transaction))
            {
                updateRequest.Parameters.AddWithValue("@adminNote", adminNote);
                updateRequest.Parameters.AddWithValue("@id", requestId);
                await updateRequest.ExecuteNonQueryAsync(cancellationToken);
            }

            await using (var rejectOthers = new MySqlCommand(
                """
                UPDATE booking_reschedule_requests
                SET status = 'rejected',
                    admin_note = 'Another reschedule request was approved.',
                    reviewed_at = NOW()
                WHERE booking_id = @bookingId
                  AND id <> @id
                  AND status = 'pending';
                """,
                connection,
                transaction))
            {
                rejectOthers.Parameters.AddWithValue("@bookingId", request.BookingId);
                rejectOthers.Parameters.AddWithValue("@id", requestId);
                await rejectOthers.ExecuteNonQueryAsync(cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);

            updatedRequest = await GetRescheduleRequestByIdAsync(requestId, cancellationToken);
            updatedBooking = await GetAdminBookingByIdAsync(request.BookingId, cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        if (updatedBooking is null)
        {
            throw new ApiException(StatusCodes.Status404NotFound, "Booking not found");
        }

        await _emailService.SendRescheduleApprovedAsync(updatedBooking, updatedRequest, cancellationToken);
        return updatedRequest;
    }

    public async Task<RescheduleRequestDto> RejectRescheduleRequestAsync(
        int requestId,
        string? adminNote,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            UPDATE booking_reschedule_requests
            SET status = 'rejected',
                admin_note = @adminNote,
                reviewed_at = NOW()
            WHERE id = @id
              AND status = 'pending';
            """,
            connection);
        command.Parameters.AddWithValue("@adminNote", adminNote);
        command.Parameters.AddWithValue("@id", requestId);

        var affected = await command.ExecuteNonQueryAsync(cancellationToken);
        if (affected == 0)
        {
            throw new ApiException(StatusCodes.Status404NotFound, "Pending reschedule request not found");
        }

        var updatedRequest = await GetRescheduleRequestByIdAsync(requestId, cancellationToken);
        var booking = await GetAdminBookingByIdAsync(updatedRequest.BookingId, cancellationToken)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Booking not found");

        await _emailService.SendRescheduleRejectedAsync(booking, updatedRequest, cancellationToken);
        return updatedRequest;
    }

    public async Task ProcessStripeWebhookAsync(
        string? signatureHeader,
        string payload,
        CancellationToken cancellationToken = default)
    {
        if (!_stripeSettings.IsConfigured)
        {
            throw new ApiException(StatusCodes.Status500InternalServerError, "Stripe webhook is not configured");
        }

        if (string.IsNullOrWhiteSpace(signatureHeader) ||
            !_stripeService.VerifyWebhookSignature(payload, signatureHeader))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Invalid Stripe webhook signature");
        }

        using var document = JsonDocument.Parse(payload);
        var eventType = document.RootElement.GetProperty("type").GetString() ?? string.Empty;
        var dataObject = document.RootElement.GetProperty("data").GetProperty("object");

        switch (eventType)
        {
            case "payment_intent.succeeded":
                await HandlePaymentIntentSucceededAsync(dataObject, cancellationToken);
                break;
            case "payment_intent.payment_failed":
                await HandlePaymentIntentFailedAsync(dataObject, cancellationToken);
                break;
            case "charge.refunded":
                await HandleChargeRefundedAsync(dataObject, cancellationToken);
                break;
            default:
                _logger.LogInformation("Ignoring Stripe webhook event {EventType}", eventType);
                break;
        }
    }

    private async Task HandlePaymentIntentSucceededAsync(JsonElement paymentIntent, CancellationToken cancellationToken)
    {
        var paymentIntentId = paymentIntent.GetProperty("id").GetString() ?? string.Empty;
        BookingAdminDetailDto? bookingForEmail = null;

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        try
        {
            var paymentRecord = await GetPaymentAndBookingRecordAsync(connection, transaction, paymentIntentId, cancellationToken);
            if (paymentRecord is null)
            {
                await transaction.CommitAsync(cancellationToken);
                return;
            }

            var chargeId = paymentIntent.TryGetProperty("latest_charge", out var latestCharge)
                ? latestCharge.GetString()
                : null;

            var shouldConfirm = paymentRecord.BookingStatus.Equals("pending", StringComparison.OrdinalIgnoreCase) &&
                !IsExpired(paymentRecord.ExpiresAt, paymentRecord.PaymentStatus);

            var hasConflict = await HasOverlappingBookingAsync(
                connection,
                transaction,
                paymentRecord.StartTime,
                paymentRecord.EndTime,
                cancellationToken,
                paymentRecord.BookingId);

            await UpdatePaymentStatusAsync(
                connection,
                transaction,
                paymentRecord.PaymentId,
                "succeeded",
                chargeId,
                null,
                null,
                cancellationToken);

            var hasGroupConflict = false;
            if (!string.IsNullOrWhiteSpace(paymentRecord.BookingGroupToken))
            {
                hasGroupConflict = await HasGroupConflictAsync(
                    connection,
                    transaction,
                    paymentRecord.BookingGroupToken!,
                    cancellationToken);
            }

            if (shouldConfirm && !hasConflict && !hasGroupConflict)
            {
                await UpdateBookingOrGroupStatusInternalAsync(
                    connection,
                    transaction,
                    paymentRecord.BookingId,
                    paymentRecord.BookingGroupToken,
                    "confirmed",
                    null,
                    cancellationToken);
            }
            else
            {
                await UpdateBookingOrGroupStatusInternalAsync(
                    connection,
                    transaction,
                    paymentRecord.BookingId,
                    paymentRecord.BookingGroupToken,
                    "cancelled",
                    "Payment succeeded after the booking hold expired or conflicted. Manual review or refund may be required.",
                    cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);
            bookingForEmail = await GetAdminBookingByPaymentIntentIdAsync(paymentIntentId, cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        if (bookingForEmail is null)
        {
            return;
        }

        if (bookingForEmail.Status == "confirmed")
        {
            await _emailService.SendBookingConfirmedAsync(bookingForEmail, cancellationToken);
            await _emailService.SendAdminNewBookingAsync(bookingForEmail, cancellationToken);
        }
        else if (bookingForEmail.Status == "cancelled")
        {
            await _emailService.SendBookingCancelledAsync(bookingForEmail, cancellationToken);
        }
    }

    private async Task HandlePaymentIntentFailedAsync(JsonElement paymentIntent, CancellationToken cancellationToken)
    {
        var paymentIntentId = paymentIntent.GetProperty("id").GetString() ?? string.Empty;

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            UPDATE payments
            SET status = 'failed',
                updated_at = CURRENT_TIMESTAMP
            WHERE stripe_payment_intent_id = @paymentIntentId;
            """,
            connection);
        command.Parameters.AddWithValue("@paymentIntentId", paymentIntentId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task HandleChargeRefundedAsync(JsonElement charge, CancellationToken cancellationToken)
    {
        var paymentIntentId = charge.TryGetProperty("payment_intent", out var paymentIntentProperty)
            ? paymentIntentProperty.GetString()
            : null;
        if (string.IsNullOrWhiteSpace(paymentIntentId))
        {
            return;
        }

        var refundAmount = charge.TryGetProperty("amount_refunded", out var amountRefunded)
            ? amountRefunded.GetInt32()
            : 0;
        var chargeId = charge.TryGetProperty("id", out var chargeIdProperty)
            ? chargeIdProperty.GetString()
            : null;

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            UPDATE payments
            SET status = CASE
                    WHEN amount_cents = @refundAmount THEN 'refunded'
                    ELSE 'partially_refunded'
                END,
                refund_amount_cents = @refundAmount,
                stripe_charge_id = COALESCE(@chargeId, stripe_charge_id),
                refunded_at = NOW(),
                updated_at = CURRENT_TIMESTAMP
            WHERE stripe_payment_intent_id = @paymentIntentId;
            """,
            connection);
        command.Parameters.AddWithValue("@refundAmount", refundAmount);
        command.Parameters.AddWithValue("@chargeId", chargeId);
        command.Parameters.AddWithValue("@paymentIntentId", paymentIntentId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task<BookingAdminDetailDto?> GetAdminBookingByPaymentIntentIdAsync(
        string paymentIntentId,
        CancellationToken cancellationToken)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        return await GetAdminBookingByPredicateAsync(
            connection,
            "p.stripe_payment_intent_id = @value",
            new MySqlParameter("@value", paymentIntentId),
            cancellationToken);
    }

    private static List<BookingTimeRangeInputDto> ValidateAndNormalizeCreateBookingRequest(CreateBookingRequest request)
    {
        if (request.Customer is null)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Missing required fields");
        }

        if (string.IsNullOrWhiteSpace(request.Customer.FirstName) ||
            string.IsNullOrWhiteSpace(request.Customer.LastName) ||
            string.IsNullOrWhiteSpace(request.Customer.Email) ||
            string.IsNullOrWhiteSpace(request.Customer.Phone))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Customer information is incomplete");
        }

        var hasMultiple = request.Slots is { Count: > 0 };
        if (!hasMultiple && (!request.StartTime.HasValue || !request.EndTime.HasValue))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Missing booking time range");
        }

        var slots = hasMultiple
            ? request.Slots!
            : new List<BookingTimeRangeInputDto>
            {
                new()
                {
                    StartTime = request.StartTime!.Value,
                    EndTime = request.EndTime!.Value,
                },
            };

        var normalized = slots
            .Select(slot => new BookingTimeRangeInputDto
            {
                StartTime = slot.StartTime,
                EndTime = slot.EndTime,
            })
            .OrderBy(slot => slot.StartTime)
            .ToList();

        if (normalized.Count == 0)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "At least one slot is required");
        }

        for (var index = 0; index < normalized.Count; index += 1)
        {
            var slot = normalized[index];
            if (slot.StartTime == default || slot.EndTime == default || slot.EndTime <= slot.StartTime)
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "Invalid slot range");
            }

            if (index > 0 && normalized[index - 1].StartTime == slot.StartTime && normalized[index - 1].EndTime == slot.EndTime)
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "Duplicate slot ranges are not allowed");
            }
        }

        return normalized;
    }

    private async Task EnsureSlotIsAvailableAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        DateTime startTime,
        DateTime endTime,
        int durationMinutes,
        CancellationToken cancellationToken,
        int? ignoreBookingId = null)
    {
        var availableSlots = await _availabilityService.GetAvailableSlotsAsync(
            DateOnly.FromDateTime(startTime),
            durationMinutes,
            cancellationToken);
        var requestedSlot = availableSlots.Slots.FirstOrDefault(slot =>
            slot.StartTime == startTime && slot.EndTime == endTime);

        if (requestedSlot is null || !requestedSlot.Available)
        {
            throw new ApiException(StatusCodes.Status409Conflict, "Selected time slot is no longer available");
        }

        var hasConflict = await HasOverlappingBookingAsync(
            connection,
            transaction,
            startTime,
            endTime,
            cancellationToken,
            ignoreBookingId);
        if (hasConflict)
        {
            throw new ApiException(StatusCodes.Status409Conflict, "Time slot conflicts with existing booking");
        }
    }

    private static async Task<bool> HasOverlappingBookingAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        DateTime startTime,
        DateTime endTime,
        CancellationToken cancellationToken,
        int? ignoreBookingId = null)
    {
        await using var command = new MySqlCommand(
            """
            SELECT 1
            FROM bookings
            WHERE (@ignoreBookingId IS NULL OR id <> @ignoreBookingId)
              AND status IN ('pending', 'confirmed')
              AND (
                    status <> 'pending'
                    OR expires_at IS NULL
                    OR expires_at > NOW()
                  )
              AND (
                    (start_time <= @startTime AND end_time > @startTime) OR
                    (start_time < @endTime AND end_time >= @endTime) OR
                    (start_time >= @startTime AND end_time <= @endTime)
                  )
            LIMIT 1;
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("@ignoreBookingId", ignoreBookingId);
        command.Parameters.AddWithValue("@startTime", startTime);
        command.Parameters.AddWithValue("@endTime", endTime);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result is not null;
    }

    private static async Task<int> FindOrCreateCustomerAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        CustomerInputDto customer,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = customer.Email.Trim().ToLowerInvariant();

        await using var findCommand = new MySqlCommand(
            "SELECT id FROM customers WHERE email = @email LIMIT 1;",
            connection,
            transaction);
        findCommand.Parameters.AddWithValue("@email", normalizedEmail);

        var existingId = await findCommand.ExecuteScalarAsync(cancellationToken);
        if (existingId is not null)
        {
            var customerId = Convert.ToInt32(existingId);
            await using var updateCommand = new MySqlCommand(
                """
                UPDATE customers
                SET first_name = @firstName,
                    last_name = @lastName,
                    phone = @phone,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = @id;
                """,
                connection,
                transaction);
            updateCommand.Parameters.AddWithValue("@firstName", customer.FirstName.Trim());
            updateCommand.Parameters.AddWithValue("@lastName", customer.LastName.Trim());
            updateCommand.Parameters.AddWithValue("@phone", customer.Phone.Trim());
            updateCommand.Parameters.AddWithValue("@id", customerId);
            await updateCommand.ExecuteNonQueryAsync(cancellationToken);
            return customerId;
        }

        await using var insertCommand = new MySqlCommand(
            """
            INSERT INTO customers (first_name, last_name, email, phone)
            VALUES (@firstName, @lastName, @email, @phone);
            """,
            connection,
            transaction);
        insertCommand.Parameters.AddWithValue("@firstName", customer.FirstName.Trim());
        insertCommand.Parameters.AddWithValue("@lastName", customer.LastName.Trim());
        insertCommand.Parameters.AddWithValue("@email", normalizedEmail);
        insertCommand.Parameters.AddWithValue("@phone", customer.Phone.Trim());
        await insertCommand.ExecuteNonQueryAsync(cancellationToken);

        return (int)insertCommand.LastInsertedId;
    }

    private static async Task<int> InsertPendingBookingAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        int customerId,
        int serviceTypeId,
        DateTime startTime,
        DateTime endTime,
        int durationMinutes,
        int priceCents,
        string? notes,
        string manageToken,
        string? bookingGroupToken,
        DateTime expiresAt,
        CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(
            """
            INSERT INTO bookings
                (customer_id, service_type_id, start_time, end_time, duration_minutes, status, price_cents, notes, manage_token, booking_group_token, expires_at)
            VALUES
                (@customerId, @serviceTypeId, @startTime, @endTime, @durationMinutes, 'pending', @priceCents, @notes, @manageToken, @bookingGroupToken, @expiresAt);
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("@customerId", customerId);
        command.Parameters.AddWithValue("@serviceTypeId", serviceTypeId);
        command.Parameters.AddWithValue("@startTime", startTime);
        command.Parameters.AddWithValue("@endTime", endTime);
        command.Parameters.AddWithValue("@durationMinutes", durationMinutes);
        command.Parameters.AddWithValue("@priceCents", priceCents);
        command.Parameters.AddWithValue("@notes", notes);
        command.Parameters.AddWithValue("@manageToken", manageToken);
        command.Parameters.AddWithValue("@bookingGroupToken", bookingGroupToken);
        command.Parameters.AddWithValue("@expiresAt", expiresAt);
        await command.ExecuteNonQueryAsync(cancellationToken);

        return (int)command.LastInsertedId;
    }

    private static async Task InsertPendingPaymentAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        int bookingId,
        StripePaymentIntentDto paymentIntent,
        CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(
            """
            INSERT INTO payments
                (booking_id, stripe_payment_intent_id, amount_cents, currency, status)
            VALUES
                (@bookingId, @paymentIntentId, @amount, @currency, 'pending');
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("@bookingId", bookingId);
        command.Parameters.AddWithValue("@paymentIntentId", paymentIntent.Id);
        command.Parameters.AddWithValue("@amount", paymentIntent.Amount);
        command.Parameters.AddWithValue("@currency", paymentIntent.Currency);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task<BookingDetailsDto?> GetBookingDetailsByPredicateAsync(
        MySqlConnection connection,
        string predicate,
        MySqlParameter parameter,
        CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(
            $"""
            SELECT
                b.id,
                b.start_time,
                b.end_time,
                b.status,
                b.notes,
                b.created_at,
                b.updated_at,
                b.expires_at,
                c.id AS customer_id,
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                s.id AS service_id,
                s.name_zh AS service_name,
                b.duration_minutes,
                ROUND(b.price_cents / 100, 2) AS price,
                p.id AS payment_id,
                p.stripe_payment_intent_id,
                p.status AS payment_status
            FROM bookings b
            JOIN customers c ON b.customer_id = c.id
            JOIN service_types s ON b.service_type_id = s.id
            LEFT JOIN payments p ON p.booking_id = b.id
            WHERE {predicate}
            LIMIT 1;
            """,
            connection);
        command.Parameters.Add(parameter);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new BookingDetailsDto
        {
            Id = reader.GetInt32("id"),
            StartTime = reader.GetDateTime("start_time"),
            EndTime = reader.GetDateTime("end_time"),
            Status = GetEffectiveStatus(
                reader.GetString("status"),
                reader.GetNullableDateTime("expires_at"),
                reader.GetNullableString("payment_status")),
            Notes = reader.GetNullableString("notes"),
            CreatedAt = reader.GetDateTime("created_at"),
            UpdatedAt = reader.GetNullableDateTime("updated_at"),
            CustomerId = reader.GetInt32("customer_id"),
            FirstName = reader.GetString("first_name"),
            LastName = reader.GetString("last_name"),
            Email = reader.GetString("email"),
            Phone = reader.GetString("phone"),
            ServiceId = reader.GetInt32("service_id"),
            ServiceName = reader.GetString("service_name"),
            DurationMinutes = reader.GetInt32("duration_minutes"),
            Price = reader.GetDecimal("price"),
            PaymentId = reader.GetNullableInt32("payment_id"),
            StripePaymentIntentId = reader.GetNullableString("stripe_payment_intent_id"),
            PaymentStatus = reader.GetNullableString("payment_status"),
            ExpiresAt = reader.GetNullableDateTime("expires_at"),
        };
    }

    private async Task<BookingAdminDetailDto?> GetAdminBookingByPredicateAsync(
        MySqlConnection connection,
        string predicate,
        MySqlParameter parameter,
        CancellationToken cancellationToken)
    {
        BookingAdminDetailDto? detail;
        await using (var command = new MySqlCommand(
            $"""
            SELECT
                b.id,
                b.start_time,
                b.end_time,
                b.status,
                b.expires_at,
                b.notes,
                b.created_at,
                b.updated_at,
                b.cancellation_reason,
                b.manage_token,
                b.duration_minutes,
                ROUND(b.price_cents / 100, 2) AS price,
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                s.id AS service_id,
                s.name_zh AS service_name,
                p.status AS payment_status,
                p.stripe_payment_intent_id
            FROM bookings b
            JOIN customers c ON b.customer_id = c.id
            JOIN service_types s ON b.service_type_id = s.id
            LEFT JOIN payments p ON p.booking_id = b.id
            WHERE {predicate}
            LIMIT 1;
            """,
            connection))
        {
            command.Parameters.Add(parameter);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                return null;
            }

            detail = new BookingAdminDetailDto
            {
                Id = reader.GetInt32("id"),
                Status = GetEffectiveStatus(
                    reader.GetString("status"),
                    reader.GetNullableDateTime("expires_at"),
                    reader.GetNullableString("payment_status")),
                PaymentStatus = reader.GetNullableString("payment_status"),
                StartTime = reader.GetDateTime("start_time"),
                EndTime = reader.GetDateTime("end_time"),
                DurationMinutes = reader.GetInt32("duration_minutes"),
                Price = reader.GetDecimal("price"),
                CreatedAt = reader.GetDateTime("created_at"),
                UpdatedAt = reader.GetNullableDateTime("updated_at"),
                ExpiresAt = reader.GetNullableDateTime("expires_at"),
                CancellationReason = reader.GetNullableString("cancellation_reason"),
                ManageToken = reader.GetNullableString("manage_token"),
                CustomerName = $"{reader.GetString("first_name")} {reader.GetString("last_name")}",
                CustomerEmail = reader.GetString("email"),
                CustomerPhone = reader.GetString("phone"),
                Notes = reader.GetNullableString("notes"),
                ServiceName = reader.GetString("service_name"),
                ServiceId = reader.GetInt32("service_id"),
                StripePaymentIntentId = reader.GetNullableString("stripe_payment_intent_id"),
            };
        }

        var requests = await GetRescheduleRequestsAsync(connection, detail.Id, cancellationToken);
        return new BookingAdminDetailDto
        {
            Id = detail.Id,
            Status = detail.Status,
            PaymentStatus = detail.PaymentStatus,
            StartTime = detail.StartTime,
            EndTime = detail.EndTime,
            DurationMinutes = detail.DurationMinutes,
            Price = detail.Price,
            CreatedAt = detail.CreatedAt,
            UpdatedAt = detail.UpdatedAt,
            ExpiresAt = detail.ExpiresAt,
            CancellationReason = detail.CancellationReason,
            ManageToken = detail.ManageToken,
            CustomerName = detail.CustomerName,
            CustomerEmail = detail.CustomerEmail,
            CustomerPhone = detail.CustomerPhone,
            Notes = detail.Notes,
            ServiceName = detail.ServiceName,
            ServiceId = detail.ServiceId,
            StripePaymentIntentId = detail.StripePaymentIntentId,
            RescheduleRequests = requests,
        };
    }

    private async Task<IReadOnlyList<RescheduleRequestDto>> GetRescheduleRequestsAsync(
        MySqlConnection connection,
        int bookingId,
        CancellationToken cancellationToken)
    {
        var results = new List<RescheduleRequestDto>();

        await using var command = new MySqlCommand(
            """
            SELECT id, booking_id, requested_start_time, requested_end_time, status, customer_note, admin_note, created_at, reviewed_at
            FROM booking_reschedule_requests
            WHERE booking_id = @bookingId
            ORDER BY created_at DESC;
            """,
            connection);
        command.Parameters.AddWithValue("@bookingId", bookingId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            results.Add(MapRescheduleRequest(reader));
        }

        return results;
    }

    private async Task<ServiceTypeDto?> GetServiceTypeAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        int serviceTypeId,
        CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(
            """
            SELECT id, duration_minutes, price_cents, name, name_zh, description, is_active, created_at, updated_at,
                   ROUND(price_cents / 100, 2) AS price
            FROM service_types
            WHERE id = @id AND is_active = TRUE
            LIMIT 1;
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("@id", serviceTypeId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return MapServiceType(reader);
    }

    private static ServiceTypeDto MapServiceType(MySqlDataReader reader)
    {
        return new ServiceTypeDto
        {
            Id = reader.GetInt32("id"),
            DurationMinutes = reader.GetInt32("duration_minutes"),
            Price = reader.GetDecimal("price"),
            PriceCents = reader.GetInt32("price_cents"),
            Name = reader.GetString("name"),
            NameZh = reader.GetString("name_zh"),
            Description = reader.GetNullableString("description"),
            IsActive = reader.GetBoolean("is_active"),
            CreatedAt = reader.GetDateTime("created_at"),
            UpdatedAt = reader.GetDateTime("updated_at"),
        };
    }

    private static string GenerateManageToken()
    {
        return Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant();
    }

    private static string GetEffectiveStatus(string rawStatus, DateTime? expiresAt, string? paymentStatus)
    {
        if (rawStatus.Equals("pending", StringComparison.OrdinalIgnoreCase) &&
            expiresAt.HasValue &&
            expiresAt.Value <= DateTime.Now &&
            !string.Equals(paymentStatus, "succeeded", StringComparison.OrdinalIgnoreCase))
        {
            return "expired";
        }

        return rawStatus;
    }

    private static bool IsExpired(DateTime? expiresAt, string? paymentStatus)
    {
        return expiresAt.HasValue &&
               expiresAt.Value <= DateTime.Now &&
               !string.Equals(paymentStatus, "succeeded", StringComparison.OrdinalIgnoreCase);
    }

    private static void EnsureBookingDurationMatches(int durationMinutes, DateTime startTime, DateTime endTime)
    {
        if (endTime <= startTime)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "End time must be after start time");
        }

        var actualMinutes = (endTime - startTime).TotalMinutes;
        if (Math.Abs(actualMinutes - durationMinutes) > 0.5)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Booking duration is invalid");
        }

        if (durationMinutes < 30 || durationMinutes % 30 != 0)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Booking duration must be a multiple of 30 minutes");
        }
    }

    private static int GetRequestedDurationMinutes(DateTime startTime, DateTime endTime)
    {
        return (int)Math.Round((endTime - startTime).TotalMinutes);
    }

    private static int CalculateBookingPriceCents(int serviceBlockPriceCents, int durationMinutes)
    {
        var blockCount = durationMinutes / 30;
        return serviceBlockPriceCents * blockCount;
    }

    private static void EnsureRescheduleDurationMatches(int durationMinutes, DateTime startTime, DateTime endTime)
    {
        EnsureBookingDurationMatches(durationMinutes, startTime, endTime);
    }

    private async Task<int> ExecuteScalarIntAsync(
        MySqlConnection connection,
        string sql,
        CancellationToken cancellationToken,
        params MySqlParameter[] parameters)
    {
        await using var command = new MySqlCommand(sql, connection);
        foreach (var parameter in parameters)
        {
            command.Parameters.Add(parameter);
        }

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result switch
        {
            null => 0,
            long longValue => (int)longValue,
            int intValue => intValue,
            _ => Convert.ToInt32(result),
        };
    }

    private async Task<int> ExecuteScalarIntAsync(
        MySqlConnection connection,
        string sql,
        CancellationToken cancellationToken,
        MySqlTransaction transaction,
        params MySqlParameter[] parameters)
    {
        await using var command = new MySqlCommand(sql, connection, transaction);
        foreach (var parameter in parameters)
        {
            command.Parameters.Add(parameter);
        }

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result switch
        {
            null => 0,
            long longValue => (int)longValue,
            int intValue => intValue,
            _ => Convert.ToInt32(result),
        };
    }

    private async Task<decimal> ExecuteScalarDecimalAsync(
        MySqlConnection connection,
        string sql,
        CancellationToken cancellationToken,
        params MySqlParameter[] parameters)
    {
        await using var command = new MySqlCommand(sql, connection);
        foreach (var parameter in parameters)
        {
            command.Parameters.Add(parameter);
        }

        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result switch
        {
            null => 0m,
            decimal decimalValue => decimalValue,
            double doubleValue => Convert.ToDecimal(doubleValue),
            long longValue => longValue,
            _ => Convert.ToDecimal(result),
        };
    }

    private static async Task UpdatePaymentStatusAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        int paymentId,
        string status,
        string? chargeId,
        int? refundAmountCents,
        string? refundId,
        CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(
            """
            UPDATE payments
            SET status = @status,
                stripe_charge_id = COALESCE(@chargeId, stripe_charge_id),
                refund_amount_cents = COALESCE(@refundAmount, refund_amount_cents),
                stripe_refund_id = COALESCE(@refundId, stripe_refund_id),
                refunded_at = CASE WHEN @status IN ('refunded', 'partially_refunded') THEN NOW() ELSE refunded_at END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @id;
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("@status", status);
        command.Parameters.AddWithValue("@chargeId", chargeId);
        command.Parameters.AddWithValue("@refundAmount", refundAmountCents);
        command.Parameters.AddWithValue("@refundId", refundId);
        command.Parameters.AddWithValue("@id", paymentId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task UpdateBookingStatusInternalAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        int bookingId,
        string status,
        string? cancellationReason,
        CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(
            """
            UPDATE bookings
            SET status = @status,
                cancellation_reason = CASE WHEN @status = 'cancelled' THEN @reason ELSE cancellation_reason END,
                cancelled_at = CASE WHEN @status = 'cancelled' THEN NOW() ELSE cancelled_at END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @id;
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("@status", status);
        command.Parameters.AddWithValue("@reason", cancellationReason);
        command.Parameters.AddWithValue("@id", bookingId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task UpdateBookingOrGroupStatusInternalAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        int bookingId,
        string? bookingGroupToken,
        string status,
        string? cancellationReason,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(bookingGroupToken))
        {
            await UpdateBookingStatusInternalAsync(
                connection,
                transaction,
                bookingId,
                status,
                cancellationReason,
                cancellationToken);
            return;
        }

        await using var command = new MySqlCommand(
            """
            UPDATE bookings
            SET status = @status,
                cancellation_reason = CASE WHEN @status = 'cancelled' THEN @reason ELSE cancellation_reason END,
                cancelled_at = CASE WHEN @status = 'cancelled' THEN NOW() ELSE cancelled_at END,
                updated_at = CURRENT_TIMESTAMP
            WHERE booking_group_token = @bookingGroupToken
              AND status = 'pending';
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("@status", status);
        command.Parameters.AddWithValue("@reason", cancellationReason);
        command.Parameters.AddWithValue("@bookingGroupToken", bookingGroupToken);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<bool> HasGroupConflictAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        string bookingGroupToken,
        CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(
            """
            SELECT id, start_time, end_time
            FROM bookings
            WHERE booking_group_token = @bookingGroupToken
              AND status = 'pending';
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("@bookingGroupToken", bookingGroupToken);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var groupSlots = new List<(int Id, DateTime StartTime, DateTime EndTime)>();
        while (await reader.ReadAsync(cancellationToken))
        {
            groupSlots.Add((
                reader.GetInt32("id"),
                reader.GetDateTime("start_time"),
                reader.GetDateTime("end_time")));
        }
        await reader.CloseAsync();

        foreach (var slot in groupSlots)
        {
            var hasConflict = await HasOverlappingBookingAsync(
                connection,
                transaction,
                slot.StartTime,
                slot.EndTime,
                cancellationToken,
                slot.Id);
            if (hasConflict)
            {
                return true;
            }
        }

        return false;
    }

    private static RescheduleRequestDto MapRescheduleRequest(MySqlDataReader reader)
    {
        return new RescheduleRequestDto
        {
            Id = reader.GetInt32("id"),
            BookingId = reader.GetInt32("booking_id"),
            RequestedStartTime = reader.GetDateTime("requested_start_time"),
            RequestedEndTime = reader.GetDateTime("requested_end_time"),
            Status = reader.GetString("status"),
            CustomerNote = reader.GetNullableString("customer_note"),
            AdminNote = reader.GetNullableString("admin_note"),
            CreatedAt = reader.GetDateTime("created_at"),
            ReviewedAt = reader.GetNullableDateTime("reviewed_at"),
        };
    }

    private async Task<BookingRecord?> GetBookingRecordAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        int bookingId,
        CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(
            """
            SELECT id, status, start_time, end_time, duration_minutes, expires_at, manage_token
            FROM bookings
            WHERE id = @id
            LIMIT 1;
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("@id", bookingId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new BookingRecord(
            reader.GetInt32("id"),
            reader.GetString("status"),
            reader.GetDateTime("start_time"),
            reader.GetDateTime("end_time"),
            reader.GetInt32("duration_minutes"),
            reader.GetNullableDateTime("expires_at"),
            reader.GetNullableString("manage_token"));
    }

    private async Task<BookingRecord?> GetBookingRecordByTokenAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        string token,
        CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(
            """
            SELECT id, status, start_time, end_time, duration_minutes, expires_at, manage_token
            FROM bookings
            WHERE manage_token = @token
            LIMIT 1;
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("@token", token);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new BookingRecord(
            reader.GetInt32("id"),
            reader.GetString("status"),
            reader.GetDateTime("start_time"),
            reader.GetDateTime("end_time"),
            reader.GetInt32("duration_minutes"),
            reader.GetNullableDateTime("expires_at"),
            reader.GetNullableString("manage_token"));
    }

    private async Task<PaymentAndBookingRecord?> GetPaymentAndBookingRecordAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        string paymentIntentId,
        CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(
            """
            SELECT
                p.id AS payment_id,
                p.status AS payment_status,
                b.id AS booking_id,
                b.status AS booking_status,
                b.start_time,
                b.end_time,
                b.expires_at,
                b.booking_group_token
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            WHERE p.stripe_payment_intent_id = @paymentIntentId
            LIMIT 1;
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("@paymentIntentId", paymentIntentId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new PaymentAndBookingRecord(
            reader.GetInt32("payment_id"),
            reader.GetNullableString("payment_status"),
            reader.GetInt32("booking_id"),
            reader.GetString("booking_status"),
            reader.GetDateTime("start_time"),
            reader.GetDateTime("end_time"),
            reader.GetNullableDateTime("expires_at"),
            reader.GetNullableString("booking_group_token"));
    }

    private async Task<RescheduleRequestRecord?> GetRescheduleRequestRecordAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        int requestId,
        CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(
            """
            SELECT id, booking_id, requested_start_time, requested_end_time, status, customer_note, admin_note, created_at, reviewed_at
            FROM booking_reschedule_requests
            WHERE id = @id
            LIMIT 1;
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("@id", requestId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new RescheduleRequestRecord(
            reader.GetInt32("id"),
            reader.GetInt32("booking_id"),
            reader.GetDateTime("requested_start_time"),
            reader.GetDateTime("requested_end_time"),
            reader.GetString("status"));
    }

    private async Task<RescheduleRequestDto> GetRescheduleRequestByIdAsync(
        int requestId,
        CancellationToken cancellationToken)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            SELECT id, booking_id, requested_start_time, requested_end_time, status, customer_note, admin_note, created_at, reviewed_at
            FROM booking_reschedule_requests
            WHERE id = @id
            LIMIT 1;
            """,
            connection);
        command.Parameters.AddWithValue("@id", requestId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new ApiException(StatusCodes.Status404NotFound, "Reschedule request not found");
        }

        return MapRescheduleRequest(reader);
    }

    private sealed record BookingRecord(
        int Id,
        string Status,
        DateTime StartTime,
        DateTime EndTime,
        int DurationMinutes,
        DateTime? ExpiresAt,
        string? ManageToken);

    private sealed record PaymentAndBookingRecord(
        int PaymentId,
        string? PaymentStatus,
        int BookingId,
        string BookingStatus,
        DateTime StartTime,
        DateTime EndTime,
        DateTime? ExpiresAt,
        string? BookingGroupToken);

    private sealed record RescheduleRequestRecord(
        int Id,
        int BookingId,
        DateTime RequestedStartTime,
        DateTime RequestedEndTime,
        string Status);
}

using BookingSystem.Backend.Database;
using BookingSystem.Backend.Middleware;
using BookingSystem.Backend.Models;
using MySqlConnector;

namespace BookingSystem.Backend.Services;

public sealed class AvailabilityService
{
    private const int SlotMinutes = 30;

    private readonly MySqlConnectionFactory _connectionFactory;

    public AvailabilityService(MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<AvailableSlotsResultDto> GetAvailableSlotsAsync(
        DateOnly requestedDate,
        int durationMinutes,
        CancellationToken cancellationToken = default)
    {
        if (durationMinutes <= 0 || durationMinutes % SlotMinutes != 0)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Duration must be a positive multiple of 30 minutes");
        }

        if (requestedDate < DateOnly.FromDateTime(DateTime.Today))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Cannot book appointments in the past");
        }

        var businessHours = await GetBusinessHoursForDayAsync((int)requestedDate.DayOfWeek, cancellationToken);
        if (businessHours is null)
        {
            return new AvailableSlotsResultDto
            {
                Date = requestedDate.ToString("yyyy-MM-dd"),
                Duration = durationMinutes,
                DayOfWeek = (int)requestedDate.DayOfWeek,
                Slots = [],
                TotalSlots = 0,
            };
        }

        var dayStart = requestedDate.ToDateTime(TimeOnly.MinValue);
        var dayEnd = requestedDate.ToDateTime(TimeOnly.MaxValue);

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        var blocks = await GetBlockedPeriodsAsync(connection, dayStart, dayEnd, cancellationToken);
        var bookings = await GetBookingsAsync(connection, dayStart, dayEnd, cancellationToken);

        var slots = GenerateTimeSlots(requestedDate, businessHours.StartTime, businessHours.EndTime, durationMinutes)
            .Where(slot => !HasConflict(slot.StartTime, slot.EndTime, bookings, blocks))
            .ToList();

        return new AvailableSlotsResultDto
        {
            Date = requestedDate.ToString("yyyy-MM-dd"),
            Duration = durationMinutes,
            DayOfWeek = (int)requestedDate.DayOfWeek,
            Slots = slots,
            TotalSlots = slots.Count,
        };
    }

    public async Task<IReadOnlyList<BusinessHoursDto>> GetBusinessHoursAsync(CancellationToken cancellationToken = default)
    {
        var results = new List<BusinessHoursDto>();
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            "SELECT id, day_of_week, start_time, end_time, is_active FROM business_hours ORDER BY day_of_week;",
            connection);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            results.Add(new BusinessHoursDto
            {
                Id = reader.GetInt32("id"),
                DayOfWeek = reader.GetInt32("day_of_week"),
                StartTime = reader.GetTimeSpan("start_time").ToString(@"hh\:mm"),
                EndTime = reader.GetTimeSpan("end_time").ToString(@"hh\:mm"),
                IsActive = reader.GetBoolean("is_active"),
            });
        }

        return results;
    }

    public async Task<BusinessHoursDto> UpdateBusinessHoursAsync(
        int dayOfWeek,
        UpdateBusinessHoursRequest request,
        CancellationToken cancellationToken = default)
    {
        if (dayOfWeek is < 0 or > 6)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Invalid day of week. Must be 0-6");
        }

        if (!TimeOnly.TryParse(request.StartTime, out var startTime) ||
            !TimeOnly.TryParse(request.EndTime, out var endTime))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Start time and end time must be valid times");
        }

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            UPDATE business_hours
            SET start_time = @startTime, end_time = @endTime, is_active = @isActive
            WHERE day_of_week = @dayOfWeek;
            """,
            connection);
        command.Parameters.AddWithValue("@startTime", startTime.ToTimeSpan());
        command.Parameters.AddWithValue("@endTime", endTime.ToTimeSpan());
        command.Parameters.AddWithValue("@isActive", request.IsActive);
        command.Parameters.AddWithValue("@dayOfWeek", dayOfWeek);
        await command.ExecuteNonQueryAsync(cancellationToken);

        var businessHours = await GetBusinessHoursForDayAsync(dayOfWeek, cancellationToken, includeInactive: true);
        return businessHours ?? throw new ApiException(StatusCodes.Status404NotFound, "Business hours not found");
    }

    public async Task<IReadOnlyList<AvailabilityBlockDto>> GetAvailabilityBlocksAsync(
        DateTime? startDate,
        DateTime? endDate,
        CancellationToken cancellationToken = default)
    {
        var results = new List<AvailabilityBlockDto>();
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();

        if (startDate.HasValue && endDate.HasValue)
        {
            command.CommandText = """
                SELECT id, start_time, end_time, block_type, reason, created_at
                FROM availability_blocks
                WHERE start_time >= @startDate AND end_time <= @endDate
                ORDER BY start_time;
                """;
            command.Parameters.AddWithValue("@startDate", startDate.Value);
            command.Parameters.AddWithValue("@endDate", endDate.Value);
        }
        else
        {
            command.CommandText = """
                SELECT id, start_time, end_time, block_type, reason, created_at
                FROM availability_blocks
                ORDER BY start_time;
                """;
        }

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            results.Add(new AvailabilityBlockDto
            {
                Id = reader.GetInt32("id"),
                StartTime = reader.GetDateTime("start_time"),
                EndTime = reader.GetDateTime("end_time"),
                BlockType = reader.GetString("block_type"),
                Reason = reader.GetNullableString("reason"),
                CreatedAt = reader.GetDateTime("created_at"),
            });
        }

        return results;
    }

    public async Task<AvailabilityBlockDto> CreateAvailabilityBlockAsync(
        CreateAvailabilityBlockRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.EndTime <= request.StartTime)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "End time must be after start time");
        }

        var blockType = string.IsNullOrWhiteSpace(request.BlockType) ? "blocked" : request.BlockType;

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            INSERT INTO availability_blocks (start_time, end_time, block_type, reason)
            VALUES (@startTime, @endTime, @blockType, @reason);
            """,
            connection);
        command.Parameters.AddWithValue("@startTime", request.StartTime);
        command.Parameters.AddWithValue("@endTime", request.EndTime);
        command.Parameters.AddWithValue("@blockType", blockType);
        command.Parameters.AddWithValue("@reason", request.Reason);
        await command.ExecuteNonQueryAsync(cancellationToken);

        var blockId = (int)command.LastInsertedId;
        await using var selectCommand = new MySqlCommand(
            """
            SELECT id, start_time, end_time, block_type, reason, created_at
            FROM availability_blocks
            WHERE id = @id
            LIMIT 1;
            """,
            connection);
        selectCommand.Parameters.AddWithValue("@id", blockId);

        await using var reader = await selectCommand.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);

        return new AvailabilityBlockDto
        {
            Id = reader.GetInt32("id"),
            StartTime = reader.GetDateTime("start_time"),
            EndTime = reader.GetDateTime("end_time"),
            BlockType = reader.GetString("block_type"),
            Reason = reader.GetNullableString("reason"),
            CreatedAt = reader.GetDateTime("created_at"),
        };
    }

    public async Task DeleteAvailabilityBlockAsync(int id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            "DELETE FROM availability_blocks WHERE id = @id;",
            connection);
        command.Parameters.AddWithValue("@id", id);
        var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);

        if (affectedRows == 0)
        {
            throw new ApiException(StatusCodes.Status404NotFound, "Availability block not found");
        }
    }

    public async Task<bool> IsSlotAvailableAsync(DateTime startTime, DateTime endTime, CancellationToken cancellationToken = default)
    {
        var businessHours = await GetBusinessHoursForDayAsync((int)DateOnly.FromDateTime(startTime).DayOfWeek, cancellationToken);
        if (businessHours is null)
        {
            return false;
        }

        var businessStart = DateOnly.FromDateTime(startTime).ToDateTime(TimeOnly.Parse(businessHours.StartTime));
        var businessEnd = DateOnly.FromDateTime(startTime).ToDateTime(TimeOnly.Parse(businessHours.EndTime));

        if (startTime < businessStart || endTime > businessEnd)
        {
            return false;
        }

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        var blocks = await GetBlockedPeriodsAsync(connection, businessStart.Date, businessEnd, cancellationToken);
        var bookings = await GetBookingsAsync(connection, businessStart.Date, businessEnd, cancellationToken);

        return !HasConflict(startTime, endTime, bookings, blocks);
    }

    private async Task<BusinessHoursDto?> GetBusinessHoursForDayAsync(
        int dayOfWeek,
        CancellationToken cancellationToken,
        bool includeInactive = false)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            includeInactive
                ? """
                  SELECT id, day_of_week, start_time, end_time, is_active
                  FROM business_hours
                  WHERE day_of_week = @dayOfWeek
                  LIMIT 1;
                  """
                : """
                  SELECT id, day_of_week, start_time, end_time, is_active
                  FROM business_hours
                  WHERE day_of_week = @dayOfWeek AND is_active = TRUE
                  LIMIT 1;
                  """,
            connection);
        command.Parameters.AddWithValue("@dayOfWeek", dayOfWeek);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new BusinessHoursDto
        {
            Id = reader.GetInt32("id"),
            DayOfWeek = reader.GetInt32("day_of_week"),
            StartTime = reader.GetTimeSpan("start_time").ToString(@"hh\:mm"),
            EndTime = reader.GetTimeSpan("end_time").ToString(@"hh\:mm"),
            IsActive = reader.GetBoolean("is_active"),
        };
    }

    private static IEnumerable<AvailableSlotDto> GenerateTimeSlots(
        DateOnly date,
        string businessStartTime,
        string businessEndTime,
        int durationMinutes)
    {
        var current = date.ToDateTime(TimeOnly.Parse(businessStartTime));
        var businessEnd = date.ToDateTime(TimeOnly.Parse(businessEndTime));

        while (current < businessEnd)
        {
            var slotEnd = current.AddMinutes(durationMinutes);

            if (slotEnd <= businessEnd)
            {
                yield return new AvailableSlotDto
                {
                    StartTime = current,
                    EndTime = slotEnd,
                };
            }

            current = current.AddMinutes(SlotMinutes);
        }
    }

    private static bool HasConflict(
        DateTime slotStart,
        DateTime slotEnd,
        IReadOnlyList<(DateTime StartTime, DateTime EndTime)> bookings,
        IReadOnlyList<(DateTime StartTime, DateTime EndTime)> blocks)
    {
        static bool Overlaps(DateTime startA, DateTime endA, DateTime startB, DateTime endB)
        {
            return startA < endB && endA > startB;
        }

        return bookings.Any(booking => Overlaps(slotStart, slotEnd, booking.StartTime, booking.EndTime)) ||
               blocks.Any(block => Overlaps(slotStart, slotEnd, block.StartTime, block.EndTime));
    }

    private static async Task<IReadOnlyList<(DateTime StartTime, DateTime EndTime)>> GetBlockedPeriodsAsync(
        MySqlConnection connection,
        DateTime dayStart,
        DateTime dayEnd,
        CancellationToken cancellationToken)
    {
        var results = new List<(DateTime StartTime, DateTime EndTime)>();
        await using var command = new MySqlCommand(
            """
            SELECT start_time, end_time
            FROM availability_blocks
            WHERE block_type = 'blocked'
              AND (
                (start_time >= @dayStart AND start_time <= @dayEnd) OR
                (end_time >= @dayStart AND end_time <= @dayEnd) OR
                (start_time <= @dayStart AND end_time >= @dayEnd)
              );
            """,
            connection);
        command.Parameters.AddWithValue("@dayStart", dayStart);
        command.Parameters.AddWithValue("@dayEnd", dayEnd);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            results.Add((reader.GetDateTime("start_time"), reader.GetDateTime("end_time")));
        }

        return results;
    }

    private static async Task<IReadOnlyList<(DateTime StartTime, DateTime EndTime)>> GetBookingsAsync(
        MySqlConnection connection,
        DateTime dayStart,
        DateTime dayEnd,
        CancellationToken cancellationToken)
    {
        var results = new List<(DateTime StartTime, DateTime EndTime)>();
        await using var command = new MySqlCommand(
            """
            SELECT start_time, end_time
            FROM bookings
            WHERE status IN ('pending', 'confirmed')
              AND (
                    status <> 'pending'
                    OR expires_at IS NULL
                    OR expires_at > NOW()
                  )
              AND start_time >= @dayStart
              AND start_time <= @dayEnd
            ORDER BY start_time;
            """,
            connection);
        command.Parameters.AddWithValue("@dayStart", dayStart);
        command.Parameters.AddWithValue("@dayEnd", dayEnd);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            results.Add((reader.GetDateTime("start_time"), reader.GetDateTime("end_time")));
        }

        return results;
    }
}

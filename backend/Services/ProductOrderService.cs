using System.Text.Json;
using BookingSystem.Backend.Configuration;
using BookingSystem.Backend.Database;
using BookingSystem.Backend.Middleware;
using BookingSystem.Backend.Models;
using MySqlConnector;

namespace BookingSystem.Backend.Services;

public sealed class ProductOrderService
{
    private static readonly IReadOnlyDictionary<string, ProductDefinition> Products =
        new Dictionary<string, ProductDefinition>(StringComparer.OrdinalIgnoreCase)
        {
            ["white_magic"] = new("white_magic", "White Magic", 9900, "Harness pure energy for clarity and protection."),
            ["love_spell"] = new("love_spell", "Love Spell", 9900, "Invite harmony, warmth, and repair into your love path."),
            ["money_spell"] = new("money_spell", "Money Spell", 9900, "Shift stagnant energy around money, confidence, and opportunity."),
        };

    private readonly MySqlConnectionFactory _connectionFactory;
    private readonly StripeService _stripeService;
    private readonly StripeSettings _stripeSettings;
    private readonly ILogger<ProductOrderService> _logger;

    public ProductOrderService(
        MySqlConnectionFactory connectionFactory,
        StripeService stripeService,
        StripeSettings stripeSettings,
        ILogger<ProductOrderService> logger)
    {
        _connectionFactory = connectionFactory;
        _stripeService = stripeService;
        _stripeSettings = stripeSettings;
        _logger = logger;
    }

    public IReadOnlyList<ProductDto> GetProducts()
    {
        return Products.Values
            .Select(product => new ProductDto
            {
                Code = product.Code,
                Name = product.Name,
                PriceCents = product.PriceCents,
                Price = product.PriceCents / 100m,
                Currency = _stripeSettings.Currency,
                Description = product.Description,
            })
            .ToArray();
    }

    public async Task<ProductOrderPaymentResponseDto> CreateProductOrderAsync(
        CreateProductOrderRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!Products.TryGetValue(request.ProductCode.Trim(), out var product))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Invalid product");
        }

        var email = request.Email.Trim();
        var customerName = string.IsNullOrWhiteSpace(request.Name) ? null : request.Name.Trim();
        var notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        try
        {
            var orderId = await InsertPendingOrderAsync(
                connection,
                transaction,
                product,
                email,
                customerName,
                notes,
                _stripeSettings.Currency,
                cancellationToken);

            var paymentIntent = await _stripeService.CreateProductOrderPaymentIntentAsync(
                product.PriceCents,
                _stripeSettings.Currency,
                orderId,
                email,
                $"{product.Name} order #{orderId}",
                cancellationToken);

            await UpdateOrderPaymentIntentAsync(
                connection,
                transaction,
                orderId,
                paymentIntent.Id,
                paymentIntent.Status,
                cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return new ProductOrderPaymentResponseDto
            {
                OrderId = orderId,
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

    public async Task<ProductOrderDto?> GetProductOrderByIdAsync(int orderId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        return await GetProductOrderByPredicateAsync(
            connection,
            "id = @value",
            new MySqlParameter("@value", orderId),
            cancellationToken);
    }

    public async Task<IReadOnlyList<ProductOrderListItemDto>> GetAdminProductOrdersAsync(
        string? status,
        string? search,
        CancellationToken cancellationToken = default)
    {
        var results = new List<ProductOrderListItemDto>();

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();

        var whereClauses = new List<string>();
        if (!string.IsNullOrWhiteSpace(status))
        {
            whereClauses.Add("status = @status");
            command.Parameters.AddWithValue("@status", status.Trim().ToLowerInvariant());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            whereClauses.Add("(customer_email LIKE @search OR customer_name LIKE @search OR product_name LIKE @search)");
            command.Parameters.AddWithValue("@search", $"%{search.Trim()}%");
        }

        var whereClause = whereClauses.Count > 0 ? $"WHERE {string.Join(" AND ", whereClauses)}" : string.Empty;
        command.CommandText = $"""
            SELECT
                id,
                product_code,
                product_name,
                customer_email,
                customer_name,
                ROUND(amount_cents / 100, 2) AS amount,
                currency,
                status,
                payment_status,
                fulfilled_at,
                created_at
            FROM product_orders
            {whereClause}
            ORDER BY created_at DESC, id DESC;
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            results.Add(new ProductOrderListItemDto
            {
                Id = reader.GetInt32("id"),
                ProductCode = reader.GetString("product_code"),
                ProductName = reader.GetString("product_name"),
                CustomerEmail = reader.GetString("customer_email"),
                CustomerName = reader.GetNullableString("customer_name"),
                Amount = reader.GetDecimal("amount"),
                Currency = reader.GetString("currency"),
                Status = reader.GetString("status"),
                PaymentStatus = reader.GetString("payment_status"),
                FulfilledAt = reader.GetNullableDateTime("fulfilled_at"),
                CreatedAt = reader.GetDateTime("created_at"),
            });
        }

        return results;
    }

    public async Task<ProductOrderDto> FulfillProductOrderAsync(int orderId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            UPDATE product_orders
            SET status = 'fulfilled',
                fulfilled_at = NOW(),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @id
              AND status = 'paid'
              AND payment_status = 'succeeded';
            """,
            connection);
        command.Parameters.AddWithValue("@id", orderId);

        var affected = await command.ExecuteNonQueryAsync(cancellationToken);
        if (affected == 0)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Paid product order not found or already fulfilled");
        }

        return await GetProductOrderByIdAsync(orderId, cancellationToken)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Product order not found");
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
        var chargeId = paymentIntent.TryGetProperty("latest_charge", out var latestCharge)
            ? latestCharge.GetString()
            : null;

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            UPDATE product_orders
            SET payment_status = 'succeeded',
                status = CASE WHEN status = 'pending_payment' THEN 'paid' ELSE status END,
                stripe_charge_id = COALESCE(@chargeId, stripe_charge_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE stripe_payment_intent_id = @paymentIntentId;
            """,
            connection);
        command.Parameters.AddWithValue("@chargeId", chargeId);
        command.Parameters.AddWithValue("@paymentIntentId", paymentIntentId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task HandlePaymentIntentFailedAsync(JsonElement paymentIntent, CancellationToken cancellationToken)
    {
        var paymentIntentId = paymentIntent.GetProperty("id").GetString() ?? string.Empty;

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            UPDATE product_orders
            SET payment_status = 'failed',
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

        var amountRefunded = charge.TryGetProperty("amount_refunded", out var amountRefundedProperty)
            ? amountRefundedProperty.GetInt32()
            : 0;
        var chargeId = charge.TryGetProperty("id", out var chargeIdProperty)
            ? chargeIdProperty.GetString()
            : null;

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            UPDATE product_orders
            SET payment_status = CASE
                    WHEN amount_cents = @amountRefunded THEN 'refunded'
                    ELSE 'partially_refunded'
                END,
                stripe_charge_id = COALESCE(@chargeId, stripe_charge_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE stripe_payment_intent_id = @paymentIntentId;
            """,
            connection);
        command.Parameters.AddWithValue("@amountRefunded", amountRefunded);
        command.Parameters.AddWithValue("@chargeId", chargeId);
        command.Parameters.AddWithValue("@paymentIntentId", paymentIntentId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<int> InsertPendingOrderAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        ProductDefinition product,
        string email,
        string? customerName,
        string? notes,
        string currency,
        CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(
            """
            INSERT INTO product_orders
                (product_code, product_name, customer_email, customer_name, amount_cents, currency, notes)
            VALUES
                (@productCode, @productName, @email, @customerName, @amountCents, @currency, @notes);
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("@productCode", product.Code);
        command.Parameters.AddWithValue("@productName", product.Name);
        command.Parameters.AddWithValue("@email", email);
        command.Parameters.AddWithValue("@customerName", customerName);
        command.Parameters.AddWithValue("@amountCents", product.PriceCents);
        command.Parameters.AddWithValue("@currency", currency);
        command.Parameters.AddWithValue("@notes", notes);
        await command.ExecuteNonQueryAsync(cancellationToken);
        return (int)command.LastInsertedId;
    }

    private static async Task UpdateOrderPaymentIntentAsync(
        MySqlConnection connection,
        MySqlTransaction transaction,
        int orderId,
        string paymentIntentId,
        string paymentStatus,
        CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(
            """
            UPDATE product_orders
            SET stripe_payment_intent_id = @paymentIntentId,
                payment_status = @paymentStatus,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @orderId;
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("@paymentIntentId", paymentIntentId);
        command.Parameters.AddWithValue("@paymentStatus", NormalizeInitialPaymentStatus(paymentStatus));
        command.Parameters.AddWithValue("@orderId", orderId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<ProductOrderDto?> GetProductOrderByPredicateAsync(
        MySqlConnection connection,
        string predicate,
        MySqlParameter parameter,
        CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(
            $"""
            SELECT
                id,
                product_code,
                product_name,
                customer_email,
                customer_name,
                amount_cents,
                ROUND(amount_cents / 100, 2) AS amount,
                currency,
                status,
                payment_status,
                stripe_payment_intent_id,
                stripe_charge_id,
                notes,
                fulfilled_at,
                created_at,
                updated_at
            FROM product_orders
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

        return new ProductOrderDto
        {
            Id = reader.GetInt32("id"),
            ProductCode = reader.GetString("product_code"),
            ProductName = reader.GetString("product_name"),
            CustomerEmail = reader.GetString("customer_email"),
            CustomerName = reader.GetNullableString("customer_name"),
            Amount = reader.GetDecimal("amount"),
            AmountCents = reader.GetInt32("amount_cents"),
            Currency = reader.GetString("currency"),
            Status = reader.GetString("status"),
            PaymentStatus = reader.GetString("payment_status"),
            StripePaymentIntentId = reader.GetNullableString("stripe_payment_intent_id"),
            StripeChargeId = reader.GetNullableString("stripe_charge_id"),
            Notes = reader.GetNullableString("notes"),
            FulfilledAt = reader.GetNullableDateTime("fulfilled_at"),
            CreatedAt = reader.GetDateTime("created_at"),
            UpdatedAt = reader.GetDateTime("updated_at"),
        };
    }

    private static string NormalizeInitialPaymentStatus(string stripeStatus)
    {
        return stripeStatus.Equals("succeeded", StringComparison.OrdinalIgnoreCase)
            ? "succeeded"
            : "pending";
    }

    private sealed record ProductDefinition(string Code, string Name, int PriceCents, string Description);
}

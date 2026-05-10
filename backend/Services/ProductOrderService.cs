using BookingSystem.Backend.Configuration;
using BookingSystem.Backend.Database;
using BookingSystem.Backend.Middleware;
using BookingSystem.Backend.Models;
using MySqlConnector;

namespace BookingSystem.Backend.Services;

public sealed class ProductOrderService
{
    private readonly MySqlConnectionFactory _connectionFactory;
    private readonly StripeService _stripeService;
    private readonly StripeSettings _stripeSettings;

    public ProductOrderService(
        MySqlConnectionFactory connectionFactory,
        StripeService stripeService,
        StripeSettings stripeSettings)
    {
        _connectionFactory = connectionFactory;
        _stripeService = stripeService;
        _stripeSettings = stripeSettings;
    }

    public async Task<CreateProductOrderPaymentResponseDto> CreateAsync(
        CreateProductOrderRequest request,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

        try
        {
            await using var insertCmd = new MySqlCommand(
                """
                INSERT INTO product_orders (product_name, customer_name, customer_email, customer_phone, intention, price_cents)
                VALUES (@productName, @customerName, @customerEmail, @customerPhone, @intention, @priceCents);
                SELECT LAST_INSERT_ID();
                """,
                connection,
                transaction);

            insertCmd.Parameters.AddWithValue("@productName", request.ProductName);
            insertCmd.Parameters.AddWithValue("@customerName", request.CustomerName);
            insertCmd.Parameters.AddWithValue("@customerEmail", request.CustomerEmail);
            insertCmd.Parameters.AddWithValue("@customerPhone", (object?)request.CustomerPhone ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("@intention", (object?)request.Intention ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("@priceCents", request.PriceCents);

            var orderId = Convert.ToInt32(await insertCmd.ExecuteScalarAsync(cancellationToken));

            var paymentIntent = await _stripeService.CreatePaymentIntentAsync(
                request.PriceCents,
                _stripeSettings.Currency,
                request.CustomerEmail.Trim(),
                $"{request.ProductName} — Order #{orderId}",
                new Dictionary<string, string> { ["product_order_id"] = orderId.ToString() },
                cancellationToken);

            await using var updateCmd = new MySqlCommand(
                "UPDATE product_orders SET stripe_payment_intent_id = @piId WHERE id = @id;",
                connection,
                transaction);
            updateCmd.Parameters.AddWithValue("@piId", paymentIntent.Id);
            updateCmd.Parameters.AddWithValue("@id", orderId);
            await updateCmd.ExecuteNonQueryAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return new CreateProductOrderPaymentResponseDto
            {
                OrderId = orderId,
                ClientSecret = paymentIntent.ClientSecret,
                PublishableKey = _stripeService.PublishableKey,
                Amount = paymentIntent.Amount,
                Currency = paymentIntent.Currency,
            };
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task HandlePaymentSucceededAsync(string paymentIntentId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var cmd = new MySqlCommand(
            "UPDATE product_orders SET status = 'paid' WHERE stripe_payment_intent_id = @piId AND status = 'pending';",
            connection);
        cmd.Parameters.AddWithValue("@piId", paymentIntentId);
        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<ProductOrderDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var cmd = new MySqlCommand(
            """
            SELECT id, product_name, customer_name, customer_email, customer_phone, intention,
                   price_cents, stripe_payment_intent_id, status, created_at, updated_at
            FROM product_orders WHERE id = @id;
            """,
            connection);
        cmd.Parameters.AddWithValue("@id", id);

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? MapRow(reader) : null;
    }

    public async Task<IReadOnlyList<ProductOrderDto>> GetAllAsync(string? status, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        var sql = """
            SELECT id, product_name, customer_name, customer_email, customer_phone, intention,
                   price_cents, stripe_payment_intent_id, status, created_at, updated_at
            FROM product_orders
            """;

        if (!string.IsNullOrWhiteSpace(status))
            sql += " WHERE status = @status";

        sql += " ORDER BY created_at DESC;";

        await using var cmd = new MySqlCommand(sql, connection);
        if (!string.IsNullOrWhiteSpace(status))
            cmd.Parameters.AddWithValue("@status", status);

        var results = new List<ProductOrderDto>();
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
            results.Add(MapRow(reader));

        return results;
    }

    public async Task FulfillAsync(int id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var cmd = new MySqlCommand(
            "UPDATE product_orders SET status = 'fulfilled' WHERE id = @id;",
            connection);
        cmd.Parameters.AddWithValue("@id", id);

        var rows = await cmd.ExecuteNonQueryAsync(cancellationToken);
        if (rows == 0)
            throw new ApiException(404, "Product order not found.");
    }

    private static ProductOrderDto MapRow(MySqlDataReader reader) => new()
    {
        Id = reader.GetInt32("id"),
        ProductName = reader.GetString("product_name"),
        CustomerName = reader.GetString("customer_name"),
        CustomerEmail = reader.GetString("customer_email"),
        CustomerPhone = reader.IsDBNull(reader.GetOrdinal("customer_phone")) ? null : reader.GetString("customer_phone"),
        Intention = reader.IsDBNull(reader.GetOrdinal("intention")) ? null : reader.GetString("intention"),
        PriceCents = reader.GetInt32("price_cents"),
        StripePaymentIntentId = reader.IsDBNull(reader.GetOrdinal("stripe_payment_intent_id")) ? null : reader.GetString("stripe_payment_intent_id"),
        Status = reader.GetString("status"),
        CreatedAt = reader.GetDateTime("created_at"),
        UpdatedAt = reader.GetDateTime("updated_at"),
    };
}

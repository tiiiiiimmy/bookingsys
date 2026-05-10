using BookingSystem.Backend.Database;
using BookingSystem.Backend.Middleware;
using BookingSystem.Backend.Models;
using MySqlConnector;

namespace BookingSystem.Backend.Services;

public sealed class ProductOrderService
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public ProductOrderService(MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<ProductOrderDto> CreateAsync(CreateProductOrderRequest request, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            INSERT INTO product_orders (product_name, customer_name, customer_email, customer_phone, intention)
            VALUES (@productName, @customerName, @customerEmail, @customerPhone, @intention);
            SELECT LAST_INSERT_ID();
            """,
            connection);

        command.Parameters.AddWithValue("@productName", request.ProductName);
        command.Parameters.AddWithValue("@customerName", request.CustomerName);
        command.Parameters.AddWithValue("@customerEmail", request.CustomerEmail);
        command.Parameters.AddWithValue("@customerPhone", (object?)request.CustomerPhone ?? DBNull.Value);
        command.Parameters.AddWithValue("@intention", (object?)request.Intention ?? DBNull.Value);

        var id = Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
        return await GetByIdAsync(id, connection, cancellationToken)
               ?? throw new InvalidOperationException("Failed to retrieve created order.");
    }

    public async Task<IReadOnlyList<ProductOrderDto>> GetAllAsync(string? status, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        var sql = """
            SELECT id, product_name, customer_name, customer_email, customer_phone, intention, status, created_at, updated_at
            FROM product_orders
            """;

        if (!string.IsNullOrWhiteSpace(status))
            sql += " WHERE status = @status";

        sql += " ORDER BY created_at DESC;";

        await using var command = new MySqlCommand(sql, connection);
        if (!string.IsNullOrWhiteSpace(status))
            command.Parameters.AddWithValue("@status", status);

        var results = new List<ProductOrderDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
            results.Add(MapRow(reader));

        return results;
    }

    public async Task FulfillAsync(int id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            "UPDATE product_orders SET status = 'fulfilled' WHERE id = @id;",
            connection);
        command.Parameters.AddWithValue("@id", id);

        var rows = await command.ExecuteNonQueryAsync(cancellationToken);
        if (rows == 0)
            throw new ApiException(404, "Product order not found.");
    }

    private static async Task<ProductOrderDto?> GetByIdAsync(int id, MySqlConnection connection, CancellationToken cancellationToken)
    {
        await using var command = new MySqlCommand(
            """
            SELECT id, product_name, customer_name, customer_email, customer_phone, intention, status, created_at, updated_at
            FROM product_orders WHERE id = @id;
            """,
            connection);
        command.Parameters.AddWithValue("@id", id);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? MapRow(reader) : null;
    }

    private static ProductOrderDto MapRow(MySqlDataReader reader) => new()
    {
        Id = reader.GetInt32("id"),
        ProductName = reader.GetString("product_name"),
        CustomerName = reader.GetString("customer_name"),
        CustomerEmail = reader.GetString("customer_email"),
        CustomerPhone = reader.IsDBNull(reader.GetOrdinal("customer_phone")) ? null : reader.GetString("customer_phone"),
        Intention = reader.IsDBNull(reader.GetOrdinal("intention")) ? null : reader.GetString("intention"),
        Status = reader.GetString("status"),
        CreatedAt = reader.GetDateTime("created_at"),
        UpdatedAt = reader.GetDateTime("updated_at"),
    };
}

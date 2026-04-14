using MySqlConnector;

namespace BookingSystem.Backend.Database;

public sealed class DatabaseInitializer
{
    private static readonly Dictionary<string, int> MigrationOrder = new(StringComparer.OrdinalIgnoreCase)
    {
        ["001_create_customers.sql"] = 1,
        ["007_create_service_types.sql"] = 2,
        ["002_create_bookings.sql"] = 3,
        ["003_create_payments.sql"] = 4,
        ["004_create_availability_blocks.sql"] = 5,
        ["005_create_business_hours.sql"] = 6,
        ["006_create_admins.sql"] = 7,
        ["008_add_booking_management_fields.sql"] = 8,
        ["009_create_booking_reschedule_requests.sql"] = 9,
        ["010_drop_service_type_duration_unique.sql"] = 10,
        ["011_add_booking_group_token.sql"] = 11,
        ["012_add_arrived_booking_status.sql"] = 12,
        ["013_add_technicians_and_manual_booking_fields.sql"] = 13,
    };

    private readonly MySqlConnectionFactory _connectionFactory;
    private readonly ILogger<DatabaseInitializer> _logger;

    public DatabaseInitializer(MySqlConnectionFactory connectionFactory, ILogger<DatabaseInitializer> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    public async Task RunMigrationsAsync(CancellationToken cancellationToken = default)
    {
        var migrationsDirectory = Path.Combine(Directory.GetCurrentDirectory(), "src", "database", "migrations");
        var files = Directory.Exists(migrationsDirectory)
            ? Directory.GetFiles(migrationsDirectory, "*.sql")
                .OrderBy(path => MigrationOrder.GetValueOrDefault(Path.GetFileName(path), int.MaxValue))
                .ThenBy(path => path, StringComparer.OrdinalIgnoreCase)
                .ToArray()
            : Array.Empty<string>();

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await EnsureSchemaMigrationsTableAsync(connection, cancellationToken);
        var appliedMigrations = await LoadAppliedMigrationsAsync(connection, cancellationToken);

        foreach (var file in files)
        {
            var fileName = Path.GetFileName(file);
            if (appliedMigrations.Contains(fileName))
            {
                continue;
            }

            var sql = await File.ReadAllTextAsync(file, cancellationToken);
            await using var transaction = await connection.BeginTransactionAsync(cancellationToken);

            try
            {
                await using var command = new MySqlCommand(sql, connection, transaction);
                await command.ExecuteNonQueryAsync(cancellationToken);

                await using var insertCommand = new MySqlCommand(
                    "INSERT INTO schema_migrations (file_name) VALUES (@fileName);",
                    connection,
                    transaction);
                insertCommand.Parameters.AddWithValue("@fileName", fileName);
                await insertCommand.ExecuteNonQueryAsync(cancellationToken);

                await transaction.CommitAsync(cancellationToken);
                _logger.LogInformation("Applied migration {FileName}", fileName);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }
    }

    public async Task RunSeedsAsync(CancellationToken cancellationToken = default)
    {
        var seedsDirectory = Path.Combine(Directory.GetCurrentDirectory(), "src", "database", "seeds");
        var files = Directory.Exists(seedsDirectory)
            ? Directory.GetFiles(seedsDirectory, "*.sql").OrderBy(path => path).ToArray()
            : Array.Empty<string>();

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);

        foreach (var file in files)
        {
            var sql = await File.ReadAllTextAsync(file, cancellationToken);
            await using var command = new MySqlCommand(sql, connection);
            await command.ExecuteNonQueryAsync(cancellationToken);
            _logger.LogInformation("Applied seed {FileName}", Path.GetFileName(file));
        }

        var adminEmail = Environment.GetEnvironmentVariable("ADMIN_EMAIL") ?? "admin@massage.com";
        var adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? "admin123";
        var adminFirstName = Environment.GetEnvironmentVariable("ADMIN_FIRST_NAME") ?? "Admin";
        var adminLastName = Environment.GetEnvironmentVariable("ADMIN_LAST_NAME") ?? "User";
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword);

        const string sqlText = """
            INSERT INTO admins (email, password_hash, first_name, last_name, is_active)
            VALUES (@email, @passwordHash, @firstName, @lastName, TRUE)
            ON DUPLICATE KEY UPDATE
                password_hash = VALUES(password_hash),
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                is_active = VALUES(is_active);
            """;

        await using var adminCommand = new MySqlCommand(sqlText, connection);
        adminCommand.Parameters.AddWithValue("@email", adminEmail);
        adminCommand.Parameters.AddWithValue("@passwordHash", passwordHash);
        adminCommand.Parameters.AddWithValue("@firstName", adminFirstName);
        adminCommand.Parameters.AddWithValue("@lastName", adminLastName);
        await adminCommand.ExecuteNonQueryAsync(cancellationToken);

        _logger.LogInformation("Seeded admin account for {Email}", adminEmail);
    }

    private static async Task EnsureSchemaMigrationsTableAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                file_name VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """;

        await using var command = new MySqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<HashSet<string>> LoadAppliedMigrationsAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        var results = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        await using var command = new MySqlCommand("SELECT file_name FROM schema_migrations;", connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            results.Add(reader.GetString("file_name"));
        }

        return results;
    }
}

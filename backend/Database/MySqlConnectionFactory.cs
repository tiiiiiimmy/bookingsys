using BookingSystem.Backend.Configuration;
using MySqlConnector;

namespace BookingSystem.Backend.Database;

public sealed class MySqlConnectionFactory
{
    private readonly DatabaseSettings _settings;

    public MySqlConnectionFactory(DatabaseSettings settings)
    {
        _settings = settings;
    }

    public async Task<MySqlConnection> OpenConnectionAsync(CancellationToken cancellationToken = default)
    {
        var connection = new MySqlConnection(_settings.BuildConnectionString());
        await connection.OpenAsync(cancellationToken);
        return connection;
    }

    public async Task EnsureDatabaseExistsAsync(CancellationToken cancellationToken = default)
    {
        var connection = new MySqlConnection(_settings.BuildConnectionStringWithoutDatabase());
        await using (connection)
        {
            await connection.OpenAsync(cancellationToken);
            await using var cmd = new MySqlCommand(
                $"CREATE DATABASE IF NOT EXISTS `{_settings.Name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
                connection);
            await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
    }
}

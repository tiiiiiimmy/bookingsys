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
}

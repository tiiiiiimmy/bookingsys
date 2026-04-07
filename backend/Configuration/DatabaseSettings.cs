namespace BookingSystem.Backend.Configuration;

public sealed class DatabaseSettings
{
    public required string Host { get; init; }
    public required int Port { get; init; }
    public required string Name { get; init; }
    public required string User { get; init; }
    public required string Password { get; init; }

    public string BuildConnectionString()
    {
        return $"Server={Host};Port={Port};Database={Name};User ID={User};Password={Password};Allow User Variables=True;Treat Tiny As Boolean=True;";
    }

    public static DatabaseSettings FromEnvironment()
    {
        var password = Environment.GetEnvironmentVariable("DB_PASSWORD");
        if (password is null || password == "your_mysql_password")
        {
            throw new InvalidOperationException(
                "Database configuration is incomplete. Create backend/.env from backend/.env.example and set DB_PASSWORD to your real MySQL password.");
        }

        if (!int.TryParse(Environment.GetEnvironmentVariable("DB_PORT") ?? "3306", out var port))
        {
            throw new InvalidOperationException("Database configuration is invalid. DB_PORT must be a number.");
        }

        return new DatabaseSettings
        {
            Host = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost",
            Port = port,
            Name = Environment.GetEnvironmentVariable("DB_NAME") ?? "bookingsys",
            User = Environment.GetEnvironmentVariable("DB_USER") ?? "root",
            Password = password,
        };
    }
}

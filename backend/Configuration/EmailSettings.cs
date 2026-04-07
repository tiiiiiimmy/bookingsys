namespace BookingSystem.Backend.Configuration;

public sealed class EmailSettings
{
    public string? Host { get; init; }
    public int Port { get; init; }
    public bool Secure { get; init; }
    public string? User { get; init; }
    public string? Password { get; init; }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Host) &&
        !string.IsNullOrWhiteSpace(User) &&
        !string.IsNullOrWhiteSpace(Password);

    public static EmailSettings FromEnvironment()
    {
        var rawPort = Environment.GetEnvironmentVariable("SMTP_PORT");
        var port = int.TryParse(rawPort, out var parsedPort) ? parsedPort : 587;
        var secure = bool.TryParse(Environment.GetEnvironmentVariable("SMTP_SECURE"), out var parsedSecure) && parsedSecure;

        return new EmailSettings
        {
            Host = Environment.GetEnvironmentVariable("SMTP_HOST"),
            Port = port,
            Secure = secure,
            User = Environment.GetEnvironmentVariable("SMTP_USER"),
            Password = Environment.GetEnvironmentVariable("SMTP_PASS"),
        };
    }
}

namespace BookingSystem.Backend.Configuration;

using System.Text;

public sealed class JwtSettings
{
    public required string AccessSecret { get; init; }
    public required string RefreshSecret { get; init; }
    public required string AccessExpiry { get; init; }
    public required string RefreshExpiry { get; init; }

    public static JwtSettings FromEnvironment()
    {
        var accessSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
        var refreshSecret = Environment.GetEnvironmentVariable("JWT_REFRESH_SECRET");

        if (string.IsNullOrWhiteSpace(accessSecret) || accessSecret.Contains("your-secret-key"))
        {
            throw new InvalidOperationException("JWT_SECRET is missing. Set it in backend/.env before starting the API.");
        }

        if (string.IsNullOrWhiteSpace(refreshSecret) || refreshSecret.Contains("your-refresh-secret"))
        {
            throw new InvalidOperationException("JWT_REFRESH_SECRET is missing. Set it in backend/.env before starting the API.");
        }

        if (Encoding.UTF8.GetByteCount(accessSecret) < 32)
        {
            throw new InvalidOperationException("JWT_SECRET must be at least 32 bytes for HS256. Update it in backend/.env before starting the API.");
        }

        if (Encoding.UTF8.GetByteCount(refreshSecret) < 32)
        {
            throw new InvalidOperationException("JWT_REFRESH_SECRET must be at least 32 bytes for HS256. Update it in backend/.env before starting the API.");
        }

        return new JwtSettings
        {
            AccessSecret = accessSecret,
            RefreshSecret = refreshSecret,
            AccessExpiry = Environment.GetEnvironmentVariable("JWT_EXPIRE") ?? "15m",
            RefreshExpiry = Environment.GetEnvironmentVariable("JWT_REFRESH_EXPIRE") ?? "7d",
        };
    }
}

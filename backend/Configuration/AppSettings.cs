namespace BookingSystem.Backend.Configuration;

public sealed class AppSettings
{
    public required string[] FrontendUrls { get; init; }
    public required string AppBaseUrl { get; init; }
    public required string SupportEmail { get; init; }

    public static AppSettings FromEnvironment()
    {
        var rawFrontendUrls = Environment.GetEnvironmentVariable("FRONTEND_URLS");
        var fallbackFrontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:3000";

        var frontendUrls = (rawFrontendUrls ?? fallbackFrontendUrl)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (frontendUrls.Length == 0)
        {
            throw new InvalidOperationException("At least one frontend URL must be configured via FRONTEND_URLS or FRONTEND_URL.");
        }

        return new AppSettings
        {
            FrontendUrls = frontendUrls,
            AppBaseUrl = Environment.GetEnvironmentVariable("APP_BASE_URL") ?? frontendUrls[0],
            SupportEmail = Environment.GetEnvironmentVariable("SUPPORT_EMAIL") ?? "support@example.com",
        };
    }
}

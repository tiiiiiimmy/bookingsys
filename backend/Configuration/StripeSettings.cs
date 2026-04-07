namespace BookingSystem.Backend.Configuration;

public sealed class StripeSettings
{
    public string? SecretKey { get; init; }
    public string? PublishableKey { get; init; }
    public string? WebhookSecret { get; init; }
    public string Currency { get; init; } = "usd";

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(SecretKey) &&
        !string.IsNullOrWhiteSpace(PublishableKey) &&
        !string.IsNullOrWhiteSpace(WebhookSecret);

    public static StripeSettings FromEnvironment()
    {
        return new StripeSettings
        {
            SecretKey = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY"),
            PublishableKey = Environment.GetEnvironmentVariable("STRIPE_PUBLISHABLE_KEY"),
            WebhookSecret = Environment.GetEnvironmentVariable("STRIPE_WEBHOOK_SECRET"),
            Currency = Environment.GetEnvironmentVariable("STRIPE_CURRENCY") ?? "usd",
        };
    }
}

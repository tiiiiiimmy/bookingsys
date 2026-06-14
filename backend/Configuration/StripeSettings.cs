namespace BookingSystem.Backend.Configuration;

public sealed class StripeSettings
{
    public string? SecretKey { get; init; }
    public string? PublishableKey { get; init; }
    public string? WebhookSecret { get; init; }
    public string Currency { get; init; } = "usd";

    /// <summary>
    /// Local/test mode: skip the real Stripe API and return synthetic payment
    /// intents. Confirmation still flows through the (signed) webhook endpoint.
    /// Enabled via STRIPE_FAKE_PAYMENTS=true (injected by the e2e harness).
    /// </summary>
    public bool FakePayments { get; init; }

    public bool IsConfigured =>
        FakePayments ||
        (!string.IsNullOrWhiteSpace(SecretKey) &&
         !string.IsNullOrWhiteSpace(PublishableKey) &&
         !string.IsNullOrWhiteSpace(WebhookSecret));

    public static StripeSettings FromEnvironment()
    {
        return new StripeSettings
        {
            SecretKey = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY"),
            PublishableKey = Environment.GetEnvironmentVariable("STRIPE_PUBLISHABLE_KEY"),
            WebhookSecret = Environment.GetEnvironmentVariable("STRIPE_WEBHOOK_SECRET"),
            Currency = Environment.GetEnvironmentVariable("STRIPE_CURRENCY") ?? "usd",
            FakePayments = string.Equals(
                Environment.GetEnvironmentVariable("STRIPE_FAKE_PAYMENTS"),
                "true",
                StringComparison.OrdinalIgnoreCase),
        };
    }
}

namespace BookingSystem.Backend.Models;

public sealed class CreateBookingPaymentResponseDto
{
    public int BookingId { get; init; }
    public string ClientSecret { get; init; } = string.Empty;
    public string PublishableKey { get; init; } = string.Empty;
    public int Amount { get; init; }
    public string Currency { get; init; } = "usd";
    public string Status { get; init; } = string.Empty;
}

public sealed class StripePaymentIntentDto
{
    public string Id { get; init; } = string.Empty;
    public string ClientSecret { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public int Amount { get; init; }
    public string Currency { get; init; } = "usd";
}

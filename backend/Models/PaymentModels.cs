namespace BookingSystem.Backend.Models;

public sealed class CreateBookingPaymentResponseDto
{
    public int BookingId { get; init; }
    public string ClientSecret { get; init; } = string.Empty;
    public string PublishableKey { get; init; } = string.Empty;
    public int Amount { get; init; }
    public string Currency { get; init; } = "usd";
    public string Status { get; init; } = string.Empty;
    public string? ManageToken { get; init; }
}

public sealed class BookingPaymentLinkDto
{
    public int BookingId { get; init; }
    public string ManageToken { get; init; } = string.Empty;
    public string ClientSecret { get; init; } = string.Empty;
    public string PublishableKey { get; init; } = string.Empty;
    public int Amount { get; init; }
    public string Currency { get; init; } = "usd";
    public string Status { get; init; } = string.Empty;
    public string BookingStatus { get; init; } = string.Empty;
    public string? PaymentStatus { get; init; }
}

public sealed class StripePaymentIntentDto
{
    public string Id { get; init; } = string.Empty;
    public string ClientSecret { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public int Amount { get; init; }
    public string Currency { get; init; } = "usd";
}

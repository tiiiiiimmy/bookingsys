using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BookingSystem.Backend.Models;

public sealed class CreateProductOrderRequest
{
    [Required]
    [JsonPropertyName("productName")]
    public string ProductName { get; init; } = string.Empty;

    [Required]
    [JsonPropertyName("customerName")]
    public string CustomerName { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    [JsonPropertyName("customerEmail")]
    public string CustomerEmail { get; init; } = string.Empty;

    [JsonPropertyName("customerPhone")]
    public string? CustomerPhone { get; init; }

    [JsonPropertyName("intention")]
    public string? Intention { get; init; }

    [Required]
    [Range(1, int.MaxValue)]
    [JsonPropertyName("priceCents")]
    public int PriceCents { get; init; }
}

public sealed class CreateProductOrderPaymentResponseDto
{
    [JsonPropertyName("orderId")]
    public int OrderId { get; init; }

    [JsonPropertyName("clientSecret")]
    public string ClientSecret { get; init; } = string.Empty;

    [JsonPropertyName("publishableKey")]
    public string PublishableKey { get; init; } = string.Empty;

    [JsonPropertyName("amount")]
    public int Amount { get; init; }

    [JsonPropertyName("currency")]
    public string Currency { get; init; } = string.Empty;
}

public sealed class ProductOrderDto
{
    [JsonPropertyName("id")]
    public int Id { get; init; }

    [JsonPropertyName("productName")]
    public string ProductName { get; init; } = string.Empty;

    [JsonPropertyName("customerName")]
    public string CustomerName { get; init; } = string.Empty;

    [JsonPropertyName("customerEmail")]
    public string CustomerEmail { get; init; } = string.Empty;

    [JsonPropertyName("customerPhone")]
    public string? CustomerPhone { get; init; }

    [JsonPropertyName("intention")]
    public string? Intention { get; init; }

    [JsonPropertyName("priceCents")]
    public int PriceCents { get; init; }

    [JsonPropertyName("stripePaymentIntentId")]
    public string? StripePaymentIntentId { get; init; }

    [JsonPropertyName("status")]
    public string Status { get; init; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; init; }

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; init; }
}

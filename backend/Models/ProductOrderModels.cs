using System.ComponentModel.DataAnnotations;

namespace BookingSystem.Backend.Models;

public sealed class ProductDto
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public int PriceCents { get; init; }
    public decimal Price { get; init; }
    public string Currency { get; init; } = "usd";
    public string Description { get; init; } = string.Empty;
}

public sealed class CreateProductOrderRequest
{
    [Required]
    public string ProductCode { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    public string? Name { get; init; }
    public string? Notes { get; init; }
}

public sealed class ProductOrderPaymentResponseDto
{
    public int OrderId { get; init; }
    public string ClientSecret { get; init; } = string.Empty;
    public string PublishableKey { get; init; } = string.Empty;
    public int Amount { get; init; }
    public string Currency { get; init; } = "usd";
    public string Status { get; init; } = string.Empty;
}

public sealed class ProductOrderDto
{
    public int Id { get; init; }
    public string ProductCode { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public string CustomerEmail { get; init; } = string.Empty;
    public string? CustomerName { get; init; }
    public decimal Amount { get; init; }
    public int AmountCents { get; init; }
    public string Currency { get; init; } = "usd";
    public string Status { get; init; } = string.Empty;
    public string PaymentStatus { get; init; } = string.Empty;
    public string? StripePaymentIntentId { get; init; }
    public string? StripeChargeId { get; init; }
    public string? Notes { get; init; }
    public DateTime? FulfilledAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public sealed class ProductOrderListItemDto
{
    public int Id { get; init; }
    public string ProductCode { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public string CustomerEmail { get; init; } = string.Empty;
    public string? CustomerName { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "usd";
    public string Status { get; init; } = string.Empty;
    public string PaymentStatus { get; init; } = string.Empty;
    public DateTime? FulfilledAt { get; init; }
    public DateTime CreatedAt { get; init; }
}

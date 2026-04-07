using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BookingSystem.Backend.Models;

public sealed class ServiceTypeDto
{
    [JsonPropertyName("id")]
    public int Id { get; init; }

    [JsonPropertyName("duration_minutes")]
    public int DurationMinutes { get; init; }

    [JsonPropertyName("price")]
    public decimal Price { get; init; }

    [JsonPropertyName("price_cents")]
    public int PriceCents { get; init; }

    [JsonPropertyName("name")]
    public string Name { get; init; } = string.Empty;

    [JsonPropertyName("name_zh")]
    public string NameZh { get; init; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; init; }

    [JsonPropertyName("is_active")]
    public bool IsActive { get; init; }

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; init; }

    [JsonPropertyName("updated_at")]
    public DateTime UpdatedAt { get; init; }
}

public sealed class CustomerInputDto
{
    [Required]
    public string FirstName { get; init; } = string.Empty;

    [Required]
    public string LastName { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    public string Phone { get; init; } = string.Empty;

    public string? Notes { get; init; }
}

public sealed class CreateBookingRequest
{
    [Range(1, int.MaxValue)]
    public int ServiceTypeId { get; init; }

    public DateTime StartTime { get; init; }

    public DateTime EndTime { get; init; }

    [Required]
    public CustomerInputDto Customer { get; init; } = new();
}

public sealed class BookingDetailsDto
{
    [JsonPropertyName("id")]
    public int Id { get; init; }

    [JsonPropertyName("start_time")]
    public DateTime StartTime { get; init; }

    [JsonPropertyName("end_time")]
    public DateTime EndTime { get; init; }

    [JsonPropertyName("status")]
    public string Status { get; init; } = string.Empty;

    [JsonPropertyName("notes")]
    public string? Notes { get; init; }

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; init; }

    [JsonPropertyName("updated_at")]
    public DateTime? UpdatedAt { get; init; }

    [JsonPropertyName("customer_id")]
    public int CustomerId { get; init; }

    [JsonPropertyName("first_name")]
    public string FirstName { get; init; } = string.Empty;

    [JsonPropertyName("last_name")]
    public string LastName { get; init; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; init; } = string.Empty;

    [JsonPropertyName("phone")]
    public string Phone { get; init; } = string.Empty;

    [JsonPropertyName("service_id")]
    public int ServiceId { get; init; }

    [JsonPropertyName("service_name")]
    public string ServiceName { get; init; } = string.Empty;

    [JsonPropertyName("duration_minutes")]
    public int DurationMinutes { get; init; }

    [JsonPropertyName("price")]
    public decimal Price { get; init; }

    [JsonPropertyName("payment_id")]
    public int? PaymentId { get; init; }

    [JsonPropertyName("stripe_payment_intent_id")]
    public string? StripePaymentIntentId { get; init; }

    [JsonPropertyName("payment_status")]
    public string? PaymentStatus { get; init; }

    [JsonPropertyName("expires_at")]
    public DateTime? ExpiresAt { get; init; }
}

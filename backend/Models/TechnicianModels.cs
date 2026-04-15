using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BookingSystem.Backend.Models;

public class TechnicianDto
{
    [JsonPropertyName("id")]
    public int Id { get; init; }

    [JsonPropertyName("display_name")]
    public string DisplayName { get; init; } = string.Empty;

    [JsonPropertyName("display_name_zh")]
    public string? DisplayNameZh { get; init; }

    [JsonPropertyName("bio")]
    public string? Bio { get; init; }

    [JsonPropertyName("is_active")]
    public bool IsActive { get; init; }

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; init; }

    [JsonPropertyName("updated_at")]
    public DateTime UpdatedAt { get; init; }
}

public sealed class TechnicianAdminSummaryDto : TechnicianDto
{
    [JsonPropertyName("week_start")]
    public DateTime WeekStart { get; init; }

    [JsonPropertyName("week_end")]
    public DateTime WeekEnd { get; init; }

    [JsonPropertyName("completed_bookings")]
    public int CompletedBookings { get; init; }

    [JsonPropertyName("weekly_hours")]
    public decimal WeeklyHours { get; init; }
}

public sealed class TechnicianWeeklyHoursDto
{
    [JsonPropertyName("technician_id")]
    public int TechnicianId { get; init; }

    [JsonPropertyName("technician_name")]
    public string TechnicianName { get; init; } = string.Empty;

    [JsonPropertyName("week_start")]
    public DateTime WeekStart { get; init; }

    [JsonPropertyName("week_end")]
    public DateTime WeekEnd { get; init; }

    [JsonPropertyName("completed_bookings")]
    public int CompletedBookings { get; init; }

    [JsonPropertyName("weekly_hours")]
    public decimal WeeklyHours { get; init; }
}

public sealed class CreateTechnicianRequest
{
    [Required]
    public string DisplayName { get; init; } = string.Empty;

    public string? DisplayNameZh { get; init; }

    public string? Bio { get; init; }

    public bool IsActive { get; init; } = true;
}

public sealed class UpdateTechnicianRequest
{
    [Required]
    public string DisplayName { get; init; } = string.Empty;

    public string? DisplayNameZh { get; init; }

    public string? Bio { get; init; }

    public bool IsActive { get; init; }
}

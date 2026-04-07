using System.ComponentModel.DataAnnotations;

namespace BookingSystem.Backend.Models;

public sealed class BusinessHoursDto
{
    public int Id { get; init; }
    public int DayOfWeek { get; init; }
    public string StartTime { get; init; } = string.Empty;
    public string EndTime { get; init; } = string.Empty;
    public bool IsActive { get; init; }
}

public sealed class UpdateBusinessHoursRequest
{
    [Required]
    public string StartTime { get; init; } = string.Empty;

    [Required]
    public string EndTime { get; init; } = string.Empty;

    public bool IsActive { get; init; }
}

public sealed class AvailabilityBlockDto
{
    public int Id { get; init; }
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public string BlockType { get; init; } = "blocked";
    public string? Reason { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class CreateAvailabilityBlockRequest
{
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public string? BlockType { get; init; }
    public string? Reason { get; init; }
}

public sealed class AvailableSlotDto
{
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public bool Available { get; init; } = true;
}

public sealed class AvailableSlotsResultDto
{
    public string Date { get; init; } = string.Empty;
    public int Duration { get; init; }
    public int DayOfWeek { get; init; }
    public required IReadOnlyList<AvailableSlotDto> Slots { get; init; }
    public int TotalSlots { get; init; }
}

namespace BookingSystem.Backend.Models;

public sealed class ManagedBookingDto
{
    public int BookingId { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? PaymentStatus { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string CustomerEmail { get; init; } = string.Empty;
    public string CustomerPhone { get; init; } = string.Empty;
    public string ServiceName { get; init; } = string.Empty;
    public int? TechnicianId { get; init; }
    public string? TechnicianName { get; init; }
    public int DurationMinutes { get; init; }
    public decimal Price { get; init; }
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public string SupportEmail { get; init; } = string.Empty;
    public bool CanRequestReschedule { get; init; }
    public IReadOnlyList<RescheduleRequestDto> RescheduleRequests { get; init; } = [];
}

public sealed class CreateRescheduleRequestInput
{
    public DateTime RequestedStartTime { get; init; }
    public DateTime RequestedEndTime { get; init; }
    public string? CustomerNote { get; init; }
}

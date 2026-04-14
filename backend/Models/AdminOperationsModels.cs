using System.ComponentModel.DataAnnotations;

namespace BookingSystem.Backend.Models;

public sealed class BookingListItemDto
{
    public int Id { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string CustomerEmail { get; init; } = string.Empty;
    public string CustomerPhone { get; init; } = string.Empty;
    public string ServiceName { get; init; } = string.Empty;
    public int? TechnicianId { get; init; }
    public string? TechnicianName { get; init; }
    public int DurationMinutes { get; init; }
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? PaymentStatus { get; init; }
    public string? PaymentSource { get; init; }
    public string CreatedVia { get; init; } = "public";
    public string? PaymentMode { get; init; }
    public string? PaymentLink { get; init; }
    public decimal Price { get; init; }
    public DateTime CreatedAt { get; init; }
    public int PendingRescheduleRequests { get; init; }
}

public sealed class BookingAdminDetailDto
{
    public int Id { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? PaymentStatus { get; init; }
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public int DurationMinutes { get; init; }
    public decimal Price { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public string? CancellationReason { get; init; }
    public string? ManageToken { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string CustomerEmail { get; init; } = string.Empty;
    public string CustomerPhone { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public string ServiceName { get; init; } = string.Empty;
    public int ServiceId { get; init; }
    public int? TechnicianId { get; init; }
    public string? TechnicianName { get; init; }
    public string? PaymentSource { get; init; }
    public string CreatedVia { get; init; } = "public";
    public string? PaymentMode { get; init; }
    public string? PaymentLink { get; init; }
    public string? StripePaymentIntentId { get; init; }
    public IReadOnlyList<RescheduleRequestDto> RescheduleRequests { get; init; } = [];
}

public sealed class UpdateBookingStatusRequest
{
    public string Status { get; init; } = string.Empty;
    public string? CancellationReason { get; init; }
}

public sealed class AdminRescheduleBookingRequest
{
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public string? AdminNote { get; init; }
}

public sealed class AdminReviewRescheduleRequest
{
    public string? AdminNote { get; init; }
}

public sealed class DashboardStatsDto
{
    public int TodayBookings { get; init; }
    public int WeekBookings { get; init; }
    public decimal MonthRevenue { get; init; }
    public int CustomerCount { get; init; }
    public int PendingRescheduleRequests { get; init; }
    public int UnassignedBookings { get; init; }
    public IReadOnlyList<UpcomingBookingDto> UpcomingBookings { get; init; } = [];
    public IReadOnlyList<TechnicianWeeklyHoursDto> TechnicianHours { get; init; } = [];
}

public sealed class UpcomingBookingDto
{
    public int Id { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public string ServiceName { get; init; } = string.Empty;
    public string? TechnicianName { get; init; }
    public DateTime StartTime { get; init; }
    public string Status { get; init; } = string.Empty;
}

public sealed class CustomerSummaryDto
{
    public int Id { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public int BookingCount { get; init; }
    public DateTime? LastBookingAt { get; init; }
    public decimal TotalSpent { get; init; }
}

public sealed class CustomerDetailDto
{
    public int Id { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public int BookingCount { get; init; }
    public decimal TotalSpent { get; init; }
    public IReadOnlyList<BookingListItemDto> Bookings { get; init; } = [];
}

public sealed class CreateAdminBookingRequest
{
    [Range(1, int.MaxValue)]
    public int ServiceTypeId { get; init; }

    [Range(1, int.MaxValue)]
    public int TechnicianId { get; init; }

    [Required]
    public string PaymentMode { get; init; } = string.Empty;

    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public CustomerInputDto Customer { get; init; } = new();
    public string? Notes { get; init; }
}

public sealed class CreateAdminBookingResponseDto
{
    public BookingAdminDetailDto Booking { get; init; } = new();
    public string? ClientSecret { get; init; }
    public string? PublishableKey { get; init; }
}

public sealed class RescheduleRequestDto
{
    public int Id { get; init; }
    public int BookingId { get; init; }
    public DateTime RequestedStartTime { get; init; }
    public DateTime RequestedEndTime { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? CustomerNote { get; init; }
    public string? AdminNote { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ReviewedAt { get; init; }
}

using BookingSystem.Backend.Models;
using BookingSystem.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingSystem.Backend.Controllers;

[ApiController]
[Authorize]
[Route("api/admin")]
public sealed class AdminOperationsController : ControllerBase
{
    private readonly BookingService _bookingService;

    public AdminOperationsController(BookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpGet("bookings")]
    public async Task<IActionResult> GetBookings(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? status,
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetAdminBookingsAsync(startDate, endDate, status, search, cancellationToken);
        return Ok(new ApiResponse<IReadOnlyList<BookingListItemDto>> { Data = result });
    }

    [HttpGet("bookings/{id:int}")]
    public async Task<IActionResult> GetBookingById(int id, CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetAdminBookingByIdAsync(id, cancellationToken);
        if (result is null)
        {
            return NotFound(new ApiErrorEnvelope { Error = new ApiError { Message = "Booking not found" } });
        }

        return Ok(new ApiResponse<BookingAdminDetailDto> { Data = result });
    }

    [HttpPatch("bookings/{id:int}/status")]
    public async Task<IActionResult> UpdateBookingStatus(int id, [FromBody] UpdateBookingStatusRequest request, CancellationToken cancellationToken)
    {
        await _bookingService.UpdateBookingStatusAsync(id, request, cancellationToken);
        return Ok(new ApiResponse<object?> { Message = "Booking status updated" });
    }

    [HttpPost("bookings/{id:int}/reschedule")]
    public async Task<IActionResult> RescheduleBooking(int id, [FromBody] AdminRescheduleBookingRequest request, CancellationToken cancellationToken)
    {
        var result = await _bookingService.RescheduleBookingAsync(id, request, cancellationToken);
        return Ok(new ApiResponse<BookingAdminDetailDto>
        {
            Data = result,
            Message = "Booking rescheduled",
        });
    }

    [HttpGet("dashboard/stats")]
    public async Task<IActionResult> GetDashboardStats(CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetDashboardStatsAsync(cancellationToken);
        return Ok(new ApiResponse<DashboardStatsDto> { Data = result });
    }

    [HttpGet("customers")]
    public async Task<IActionResult> GetCustomers([FromQuery] string? search, CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetCustomersAsync(search, cancellationToken);
        return Ok(new ApiResponse<IReadOnlyList<CustomerSummaryDto>> { Data = result });
    }

    [HttpGet("customers/{id:int}")]
    public async Task<IActionResult> GetCustomerById(int id, CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetCustomerByIdAsync(id, cancellationToken);
        if (result is null)
        {
            return NotFound(new ApiErrorEnvelope { Error = new ApiError { Message = "Customer not found" } });
        }

        return Ok(new ApiResponse<CustomerDetailDto> { Data = result });
    }

    [HttpPost("reschedule-requests/{id:int}/approve")]
    public async Task<IActionResult> ApproveRescheduleRequest(int id, [FromBody] AdminReviewRescheduleRequest request, CancellationToken cancellationToken)
    {
        var result = await _bookingService.ApproveRescheduleRequestAsync(id, request.AdminNote, cancellationToken);
        return Ok(new ApiResponse<RescheduleRequestDto>
        {
            Data = result,
            Message = "Reschedule request approved",
        });
    }

    [HttpPost("reschedule-requests/{id:int}/reject")]
    public async Task<IActionResult> RejectRescheduleRequest(int id, [FromBody] AdminReviewRescheduleRequest request, CancellationToken cancellationToken)
    {
        var result = await _bookingService.RejectRescheduleRequestAsync(id, request.AdminNote, cancellationToken);
        return Ok(new ApiResponse<RescheduleRequestDto>
        {
            Data = result,
            Message = "Reschedule request rejected",
        });
    }
}

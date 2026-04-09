using BookingSystem.Backend.Middleware;
using BookingSystem.Backend.Models;
using BookingSystem.Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookingSystem.Backend.Controllers;

[ApiController]
[Route("api/bookings/manage")]
public sealed class BookingManagementController : ControllerBase
{
    private readonly BookingService _bookingService;

    public BookingManagementController(BookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpGet("{token}")]
    public async Task<IActionResult> GetManagedBooking(string token, CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetBookingByManageTokenAsync(token, cancellationToken);
        if (result is null)
        {
            throw new ApiException(StatusCodes.Status404NotFound, "Booking not found");
        }

        return Ok(new ApiResponse<ManagedBookingDto> { Data = result });
    }

    [HttpPost("{token}/reschedule-request")]
    public async Task<IActionResult> CreateRescheduleRequest(
        string token,
        [FromBody] CreateRescheduleRequestInput request,
        CancellationToken cancellationToken)
    {
        var result = await _bookingService.CreateRescheduleRequestAsync(token, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, new ApiResponse<RescheduleRequestDto>
        {
            Data = result,
            Message = "Reschedule request created",
        });
    }
}

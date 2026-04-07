using BookingSystem.Backend.Middleware;
using BookingSystem.Backend.Models;
using BookingSystem.Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookingSystem.Backend.Controllers;

[ApiController]
[Route("api/bookings")]
public sealed class BookingsController : ControllerBase
{
    private readonly BookingService _bookingService;

    public BookingsController(BookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpGet("service-types")]
    public async Task<IActionResult> GetServiceTypes(CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetServiceTypesAsync(cancellationToken);
        return Ok(new ApiResponse<IReadOnlyList<ServiceTypeDto>> { Data = result });
    }

    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request, CancellationToken cancellationToken)
    {
        var result = await _bookingService.CreateBookingAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, new ApiResponse<BookingDetailsDto>
        {
            Data = result,
            Message = "Booking created successfully",
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetBookingById(int id, CancellationToken cancellationToken)
    {
        var result = await _bookingService.GetBookingByIdAsync(id, cancellationToken);
        if (result is null)
        {
            throw new ApiException(StatusCodes.Status404NotFound, "Booking not found");
        }

        return Ok(new ApiResponse<BookingDetailsDto> { Data = result });
    }
}

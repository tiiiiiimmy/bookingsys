using BookingSystem.Backend.Middleware;
using BookingSystem.Backend.Models;
using BookingSystem.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingSystem.Backend.Controllers;

[ApiController]
[Route("api/availability")]
public sealed class AvailabilityController : ControllerBase
{
    private readonly AvailabilityService _availabilityService;

    public AvailabilityController(AvailabilityService availabilityService)
    {
        _availabilityService = availabilityService;
    }

    [HttpGet("slots")]
    public async Task<IActionResult> GetAvailableSlots(
        [FromQuery] string date,
        [FromQuery] int duration,
        CancellationToken cancellationToken)
    {
        if (!DateOnly.TryParse(date, out var requestedDate))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Invalid date format. Use YYYY-MM-DD");
        }

        var result = await _availabilityService.GetAvailableSlotsAsync(requestedDate, duration, cancellationToken);
        return Ok(new ApiResponse<AvailableSlotsResultDto> { Data = result });
    }

    [HttpGet("business-hours")]
    public async Task<IActionResult> GetBusinessHours(CancellationToken cancellationToken)
    {
        var result = await _availabilityService.GetBusinessHoursAsync(cancellationToken);
        return Ok(new ApiResponse<IReadOnlyList<BusinessHoursDto>> { Data = result });
    }

    [Authorize]
    [HttpPut("admin/business-hours/{dayOfWeek:int}")]
    public async Task<IActionResult> UpdateBusinessHours(
        int dayOfWeek,
        [FromBody] UpdateBusinessHoursRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _availabilityService.UpdateBusinessHoursAsync(dayOfWeek, request, cancellationToken);
        return Ok(new ApiResponse<BusinessHoursDto>
        {
            Data = result,
            Message = "Business hours updated successfully",
        });
    }

    [Authorize]
    [HttpGet("admin/blocks")]
    public async Task<IActionResult> GetAvailabilityBlocks(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken cancellationToken)
    {
        var result = await _availabilityService.GetAvailabilityBlocksAsync(startDate, endDate, cancellationToken);
        return Ok(new ApiResponse<IReadOnlyList<AvailabilityBlockDto>> { Data = result });
    }

    [Authorize]
    [HttpPost("admin/blocks")]
    public async Task<IActionResult> CreateAvailabilityBlock(
        [FromBody] CreateAvailabilityBlockRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _availabilityService.CreateAvailabilityBlockAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, new ApiResponse<AvailabilityBlockDto>
        {
            Data = result,
            Message = "Availability block created successfully",
        });
    }

    [Authorize]
    [HttpDelete("admin/blocks/{id:int}")]
    public async Task<IActionResult> DeleteAvailabilityBlock(int id, CancellationToken cancellationToken)
    {
        await _availabilityService.DeleteAvailabilityBlockAsync(id, cancellationToken);
        return Ok(new ApiResponse<object?>
        {
            Data = null,
            Message = "Availability block deleted successfully",
        });
    }
}

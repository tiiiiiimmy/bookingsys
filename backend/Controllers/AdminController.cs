using BookingSystem.Backend.Models;
using BookingSystem.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingSystem.Backend.Controllers;

[ApiController]
[Route("api/admin")]
public sealed class AdminController : ControllerBase
{
    private readonly AdminService _adminService;

    public AdminController(AdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpPost("auth/login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _adminService.LoginAsync(request, cancellationToken);
        return Ok(new ApiResponse<LoginResultDto> { Data = result });
    }

    [HttpPost("auth/refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request, CancellationToken cancellationToken)
    {
        var result = await _adminService.RefreshAsync(request, cancellationToken);
        return Ok(new ApiResponse<RefreshResultDto> { Data = result });
    }

    [Authorize]
    [HttpGet("auth/me")]
    public async Task<IActionResult> GetMe(CancellationToken cancellationToken)
    {
        var adminId = AdminService.GetAdminId(User);
        var result = await _adminService.GetMeAsync(adminId, cancellationToken);
        return Ok(new ApiResponse<AdminSummaryDto> { Data = result });
    }
}

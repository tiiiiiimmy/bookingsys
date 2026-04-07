using System.ComponentModel.DataAnnotations;

namespace BookingSystem.Backend.Models;

public sealed class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    public string Password { get; init; } = string.Empty;
}

public sealed class RefreshRequest
{
    [Required]
    public string RefreshToken { get; init; } = string.Empty;
}

public sealed class AdminSummaryDto
{
    public int Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public DateTime? LastLoginAt { get; init; }
}

public sealed class LoginResultDto
{
    public required AdminSummaryDto Admin { get; init; }
    public required string AccessToken { get; init; }
    public required string RefreshToken { get; init; }
}

public sealed class RefreshResultDto
{
    public required string AccessToken { get; init; }
}

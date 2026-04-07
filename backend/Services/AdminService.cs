using System.Security.Claims;
using BookingSystem.Backend.Database;
using BookingSystem.Backend.Middleware;
using BookingSystem.Backend.Models;
using MySqlConnector;

namespace BookingSystem.Backend.Services;

public sealed class AdminService
{
    private readonly MySqlConnectionFactory _connectionFactory;
    private readonly JwtTokenService _jwtTokenService;

    public AdminService(MySqlConnectionFactory connectionFactory, JwtTokenService jwtTokenService)
    {
        _connectionFactory = connectionFactory;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<LoginResultDto> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            SELECT id, email, password_hash, first_name, last_name
            FROM admins
            WHERE email = @email AND is_active = TRUE
            LIMIT 1;
            """,
            connection);

        command.Parameters.AddWithValue("@email", request.Email.Trim().ToLowerInvariant());

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new ApiException(StatusCodes.Status401Unauthorized, "Invalid credentials");
        }

        var adminId = reader.GetInt32("id");
        var email = reader.GetString("email");
        var passwordHash = reader.GetString("password_hash");
        var firstName = reader.GetString("first_name");
        var lastName = reader.GetString("last_name");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, passwordHash))
        {
            throw new ApiException(StatusCodes.Status401Unauthorized, "Invalid credentials");
        }

        await reader.CloseAsync();

        await using var updateCommand = new MySqlCommand(
            "UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = @id;",
            connection);
        updateCommand.Parameters.AddWithValue("@id", adminId);
        await updateCommand.ExecuteNonQueryAsync(cancellationToken);

        return new LoginResultDto
        {
            Admin = new AdminSummaryDto
            {
                Id = adminId,
                Email = email,
                FirstName = firstName,
                LastName = lastName,
            },
            AccessToken = _jwtTokenService.GenerateAccessToken(adminId, email),
            RefreshToken = _jwtTokenService.GenerateRefreshToken(adminId, email),
        };
    }

    public async Task<RefreshResultDto> RefreshAsync(RefreshRequest request, CancellationToken cancellationToken = default)
    {
        ClaimsPrincipal principal;

        try
        {
            principal = _jwtTokenService.ValidateRefreshToken(request.RefreshToken);
        }
        catch
        {
            throw new ApiException(StatusCodes.Status401Unauthorized, "Invalid or expired refresh token");
        }

        var adminId = GetAdminId(principal);

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            SELECT id, email
            FROM admins
            WHERE id = @id AND is_active = TRUE
            LIMIT 1;
            """,
            connection);

        command.Parameters.AddWithValue("@id", adminId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new ApiException(StatusCodes.Status401Unauthorized, "Admin not found or inactive");
        }

        return new RefreshResultDto
        {
            AccessToken = _jwtTokenService.GenerateAccessToken(
                reader.GetInt32("id"),
                reader.GetString("email")),
        };
    }

    public async Task<AdminSummaryDto> GetMeAsync(int adminId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            SELECT id, email, first_name, last_name, last_login_at
            FROM admins
            WHERE id = @id
            LIMIT 1;
            """,
            connection);
        command.Parameters.AddWithValue("@id", adminId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new ApiException(StatusCodes.Status404NotFound, "Admin not found");
        }

        return new AdminSummaryDto
        {
            Id = reader.GetInt32("id"),
            Email = reader.GetString("email"),
            FirstName = reader.GetString("first_name"),
            LastName = reader.GetString("last_name"),
            LastLoginAt = reader.GetNullableDateTime("last_login_at"),
        };
    }

    public static int GetAdminId(ClaimsPrincipal principal)
    {
        var rawId = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue("sub");

        if (!int.TryParse(rawId, out var adminId))
        {
            throw new ApiException(StatusCodes.Status401Unauthorized, "Token is invalid or expired");
        }

        return adminId;
    }
}

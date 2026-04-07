using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BookingSystem.Backend.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BookingSystem.Backend.Services;

public sealed class JwtTokenService
{
    private readonly JwtSettings _settings;

    public JwtTokenService(JwtSettings settings)
    {
        _settings = settings;
    }

    public string GenerateAccessToken(int adminId, string email)
    {
        return GenerateToken(adminId, email, _settings.AccessSecret, ParseLifetime(_settings.AccessExpiry));
    }

    public string GenerateRefreshToken(int adminId, string email)
    {
        return GenerateToken(adminId, email, _settings.RefreshSecret, ParseLifetime(_settings.RefreshExpiry));
    }

    public ClaimsPrincipal ValidateRefreshToken(string refreshToken)
    {
        var handler = new JwtSecurityTokenHandler();
        return handler.ValidateToken(
            refreshToken,
            CreateValidationParameters(_settings.RefreshSecret),
            out _);
    }

    public static TokenValidationParameters CreateValidationParameters(string secret)
    {
        return new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ClockSkew = TimeSpan.Zero,
            NameClaimType = ClaimTypes.NameIdentifier,
        };
    }

    private static string GenerateToken(int adminId, string email, string secret, TimeSpan lifetime)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, adminId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(JwtRegisteredClaimNames.Sub, adminId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.Add(lifetime),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static TimeSpan ParseLifetime(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return TimeSpan.FromMinutes(15);
        }

        var unit = char.ToLowerInvariant(value[^1]);
        var amountText = char.IsLetter(unit) ? value[..^1] : value;

        if (!double.TryParse(amountText, out var amount))
        {
            throw new InvalidOperationException($"Invalid JWT expiry value: {value}");
        }

        return unit switch
        {
            'm' => TimeSpan.FromMinutes(amount),
            'h' => TimeSpan.FromHours(amount),
            'd' => TimeSpan.FromDays(amount),
            _ when !char.IsLetter(unit) => TimeSpan.FromMinutes(amount),
            _ => throw new InvalidOperationException($"Unsupported JWT expiry unit: {value}"),
        };
    }
}

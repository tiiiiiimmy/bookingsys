using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using BookingSystem.Backend.Configuration;
using BookingSystem.Backend.Middleware;
using BookingSystem.Backend.Models;

namespace BookingSystem.Backend.Services;

public sealed class StripeService
{
    private readonly HttpClient _httpClient;
    private readonly StripeSettings _stripeSettings;

    public StripeService(HttpClient httpClient, StripeSettings stripeSettings)
    {
        _httpClient = httpClient;
        _stripeSettings = stripeSettings;
        _httpClient.BaseAddress = new Uri("https://api.stripe.com/v1/");
    }

    public string PublishableKey => _stripeSettings.PublishableKey ?? string.Empty;

    public async Task<StripePaymentIntentDto> CreatePaymentIntentAsync(
        int amountCents,
        string currency,
        int bookingId,
        string customerEmail,
        string description,
        CancellationToken cancellationToken = default)
    {
        EnsureConfigured();

        using var request = new HttpRequestMessage(HttpMethod.Post, "payment_intents");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _stripeSettings.SecretKey);
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["amount"] = amountCents.ToString(),
            ["currency"] = currency,
            ["automatic_payment_methods[enabled]"] = "true",
            ["receipt_email"] = customerEmail,
            ["description"] = description,
            ["metadata[booking_id]"] = bookingId.ToString(),
        });

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var payload = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new ApiException(StatusCodes.Status502BadGateway, $"Stripe payment intent creation failed: {ExtractStripeError(payload)}");
        }

        using var document = JsonDocument.Parse(payload);
        var root = document.RootElement;

        return new StripePaymentIntentDto
        {
            Id = root.GetProperty("id").GetString() ?? string.Empty,
            ClientSecret = root.GetProperty("client_secret").GetString() ?? string.Empty,
            Status = root.GetProperty("status").GetString() ?? "requires_payment_method",
            Amount = root.GetProperty("amount").GetInt32(),
            Currency = root.GetProperty("currency").GetString() ?? currency,
        };
    }

    public bool VerifyWebhookSignature(string payload, string signatureHeader)
    {
        EnsureConfigured();

        if (string.IsNullOrWhiteSpace(signatureHeader))
        {
            return false;
        }

        var parts = signatureHeader.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var timestamp = parts.FirstOrDefault(value => value.StartsWith("t=", StringComparison.Ordinal))?.Split('=')[1];
        var expectedSignature = parts.FirstOrDefault(value => value.StartsWith("v1=", StringComparison.Ordinal))?.Split('=')[1];

        if (string.IsNullOrWhiteSpace(timestamp) || string.IsNullOrWhiteSpace(expectedSignature))
        {
            return false;
        }

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_stripeSettings.WebhookSecret!));
        var signedPayload = $"{timestamp}.{payload}";
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(signedPayload));
        var computedSignature = Convert.ToHexString(hash).ToLowerInvariant();

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computedSignature),
            Encoding.UTF8.GetBytes(expectedSignature));
    }

    private void EnsureConfigured()
    {
        if (!_stripeSettings.IsConfigured)
        {
            throw new ApiException(StatusCodes.Status500InternalServerError, "Stripe is not configured. Set STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, and STRIPE_WEBHOOK_SECRET.");
        }
    }

    private static string ExtractStripeError(string payload)
    {
        try
        {
            using var document = JsonDocument.Parse(payload);
            if (document.RootElement.TryGetProperty("error", out var error) &&
                error.TryGetProperty("message", out var message))
            {
                return message.GetString() ?? "Unknown Stripe error";
            }
        }
        catch
        {
        }

        return "Unknown Stripe error";
    }
}

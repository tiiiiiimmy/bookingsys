using System.Text;
using BookingSystem.Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookingSystem.Backend.Controllers;

[ApiController]
[Route("api/webhooks")]
public sealed class WebhooksController : ControllerBase
{
    private readonly BookingService _bookingService;

    public WebhooksController(BookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpPost("stripe")]
    public async Task<IActionResult> Stripe(CancellationToken cancellationToken)
    {
        Request.EnableBuffering();
        using var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true);
        var payload = await reader.ReadToEndAsync(cancellationToken);
        Request.Body.Position = 0;

        var signatureHeader = Request.Headers["Stripe-Signature"].ToString();
        await _bookingService.ProcessStripeWebhookAsync(signatureHeader, payload, cancellationToken);

        return Ok(new { received = true });
    }
}

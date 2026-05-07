using System.Text;
using BookingSystem.Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookingSystem.Backend.Controllers;

[ApiController]
[Route("api/webhooks")]
public sealed class WebhooksController : ControllerBase
{
    private readonly BookingService _bookingService;
    private readonly ProductOrderService _productOrderService;

    public WebhooksController(BookingService bookingService, ProductOrderService productOrderService)
    {
        _bookingService = bookingService;
        _productOrderService = productOrderService;
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
        await _productOrderService.ProcessStripeWebhookAsync(signatureHeader, payload, cancellationToken);

        return Ok(new { received = true });
    }
}

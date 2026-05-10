using BookingSystem.Backend.Models;
using BookingSystem.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingSystem.Backend.Controllers;

[ApiController]
[Route("api")]
public sealed class ProductOrdersController : ControllerBase
{
    private readonly ProductOrderService _productOrderService;

    public ProductOrdersController(ProductOrderService productOrderService)
    {
        _productOrderService = productOrderService;
    }

    // Public — customer submits a product order, returns Stripe payment data
    [HttpPost("product-orders")]
    public async Task<IActionResult> Create([FromBody] CreateProductOrderRequest request, CancellationToken cancellationToken)
    {
        var payment = await _productOrderService.CreateAsync(request, cancellationToken);
        return Ok(new ApiResponse<CreateProductOrderPaymentResponseDto> { Data = payment });
    }

    // Public — get order status (for confirmation page)
    [HttpGet("product-orders/{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var order = await _productOrderService.GetByIdAsync(id, cancellationToken);
        if (order is null)
            return NotFound(new ApiResponse<object?> { Message = "Order not found." });

        return Ok(new ApiResponse<ProductOrderDto> { Data = order });
    }

    // Admin — list all product orders
    [Authorize]
    [HttpGet("admin/product-orders")]
    public async Task<IActionResult> GetAll([FromQuery] string? status, CancellationToken cancellationToken)
    {
        var orders = await _productOrderService.GetAllAsync(status, cancellationToken);
        return Ok(new ApiResponse<IReadOnlyList<ProductOrderDto>> { Data = orders });
    }

    // Admin — mark a product order as fulfilled
    [Authorize]
    [HttpPatch("admin/product-orders/{id:int}/fulfill")]
    public async Task<IActionResult> Fulfill(int id, CancellationToken cancellationToken)
    {
        await _productOrderService.FulfillAsync(id, cancellationToken);
        return Ok(new ApiResponse<object?> { Message = "Order marked as fulfilled." });
    }
}

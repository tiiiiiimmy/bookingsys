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

    // Public — customer submits a product order
    [HttpPost("product-orders")]
    public async Task<IActionResult> Create([FromBody] CreateProductOrderRequest request, CancellationToken cancellationToken)
    {
        var order = await _productOrderService.CreateAsync(request, cancellationToken);
        return Ok(new ApiResponse<ProductOrderDto> { Data = order, Message = "Order submitted successfully." });
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

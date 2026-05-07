using BookingSystem.Backend.Middleware;
using BookingSystem.Backend.Models;
using BookingSystem.Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookingSystem.Backend.Controllers;

[ApiController]
[Route("api/product-orders")]
public sealed class ProductOrdersController : ControllerBase
{
    private readonly ProductOrderService _productOrderService;

    public ProductOrdersController(ProductOrderService productOrderService)
    {
        _productOrderService = productOrderService;
    }

    [HttpGet("products")]
    public IActionResult GetProducts()
    {
        return Ok(new ApiResponse<IReadOnlyList<ProductDto>> { Data = _productOrderService.GetProducts() });
    }

    [HttpPost]
    public async Task<IActionResult> CreateProductOrder(
        [FromBody] CreateProductOrderRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _productOrderService.CreateProductOrderAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, new ApiResponse<ProductOrderPaymentResponseDto>
        {
            Data = result,
            Message = "Product order created and payment initialized",
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetProductOrderById(int id, CancellationToken cancellationToken)
    {
        var result = await _productOrderService.GetProductOrderByIdAsync(id, cancellationToken);
        if (result is null)
        {
            throw new ApiException(StatusCodes.Status404NotFound, "Product order not found");
        }

        return Ok(new ApiResponse<ProductOrderDto> { Data = result });
    }
}

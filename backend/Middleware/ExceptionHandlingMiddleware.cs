using BookingSystem.Backend.Models;

namespace BookingSystem.Backend.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IWebHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ApiException exception)
        {
            await WriteErrorAsync(context, exception.StatusCode, exception.Message, exception);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unhandled exception");
            await WriteErrorAsync(context, StatusCodes.Status500InternalServerError, exception.Message, exception);
        }
    }

    private async Task WriteErrorAsync(HttpContext context, int statusCode, string message, Exception exception)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        await context.Response.WriteAsJsonAsync(new ApiErrorEnvelope
        {
            Error = new ApiError
            {
                Message = message,
                Stack = _environment.IsDevelopment() ? exception.StackTrace : null,
            },
        });
    }
}

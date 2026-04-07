namespace BookingSystem.Backend.Models;

public sealed class ApiResponse<T>
{
    public bool Success { get; init; } = true;
    public T? Data { get; init; }
    public string? Message { get; init; }
}

public sealed class ApiErrorEnvelope
{
    public bool Success { get; init; } = false;
    public required ApiError Error { get; init; }
}

public sealed class ApiError
{
    public required string Message { get; init; }
    public string? Stack { get; init; }
}

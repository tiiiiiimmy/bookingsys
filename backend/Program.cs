using BookingSystem.Backend.Configuration;
using BookingSystem.Backend.Database;
using BookingSystem.Backend.Middleware;
using BookingSystem.Backend.Models;
using BookingSystem.Backend.Services;
using Microsoft.AspNetCore.Mvc;

EnvLoader.Load(Path.Combine(Directory.GetCurrentDirectory(), ".env"));

var builder = WebApplication.CreateBuilder(args);
var appSettings = AppSettings.FromEnvironment();
var databaseSettings = DatabaseSettings.FromEnvironment();
var jwtSettings = JwtSettings.FromEnvironment();
var stripeSettings = StripeSettings.FromEnvironment();
var emailSettings = EmailSettings.FromEnvironment();
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";

builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.AddSingleton(appSettings);
builder.Services.AddSingleton(databaseSettings);
builder.Services.AddSingleton(jwtSettings);
builder.Services.AddSingleton(stripeSettings);
builder.Services.AddSingleton(emailSettings);
builder.Services.AddSingleton<MySqlConnectionFactory>();
builder.Services.AddScoped<DatabaseInitializer>();
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddHttpClient<StripeService>();
builder.Services.AddScoped<AdminService>();
builder.Services.AddScoped<AvailabilityService>();
builder.Services.AddScoped<BookingService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(appSettings.FrontendUrls)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = JwtTokenService.CreateValidationParameters(jwtSettings.AccessSecret);
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnChallenge = async context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new ApiErrorEnvelope
            {
                Error = new ApiError
                {
                    Message = "Not authorized to access this route",
                },
            });
        },
    };
});

builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var message = context.ModelState.Values
            .SelectMany(value => value.Errors)
            .Select(error => error.ErrorMessage)
            .FirstOrDefault(message => !string.IsNullOrWhiteSpace(message))
            ?? "Request validation failed";

        return new BadRequestObjectResult(new ApiErrorEnvelope
        {
            Error = new ApiError { Message = message },
        });
    };
});

var app = builder.Build();

if (args.Contains("--migrate", StringComparer.OrdinalIgnoreCase) ||
    args.Contains("--seed", StringComparer.OrdinalIgnoreCase))
{
    using var scope = app.Services.CreateScope();
    var initializer = scope.ServiceProvider.GetRequiredService<DatabaseInitializer>();

    if (args.Contains("--migrate", StringComparer.OrdinalIgnoreCase))
    {
        await initializer.RunMigrationsAsync();
    }

    if (args.Contains("--seed", StringComparer.OrdinalIgnoreCase))
    {
        await initializer.RunSeedsAsync();
    }

    return;
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Json(new
{
    success = true,
    message = "Server is running",
}));

app.MapControllers();

app.MapFallback((HttpContext context) => Results.Json(
    new ApiErrorEnvelope
    {
        Error = new ApiError
        {
            Message = $"Not Found - {context.Request.Path}",
        },
    },
    statusCode: StatusCodes.Status404NotFound));

app.Run();

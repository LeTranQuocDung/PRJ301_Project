using Lucy.UserPaymentService.Services;
using System;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register wallet service
builder.Services.AddSingleton<IWalletService, WalletService>();

// Enable CORS with configurable allowed origins
var allowedOriginsEnv = Environment.GetEnvironmentVariable("LUCY_ALLOWED_ORIGINS");
var allowedOrigins = string.IsNullOrWhiteSpace(allowedOriginsEnv)
    ? new[] { "http://localhost:5173", "http://127.0.0.1:5173" }
    : allowedOriginsEnv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("LucyAllowConfigured", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
var enableSwaggerEnv = Environment.GetEnvironmentVariable("LUCY_ENABLE_SWAGGER");
var isSwaggerEnabled = string.Equals(enableSwaggerEnv, "true", StringComparison.OrdinalIgnoreCase);

if (app.Environment.IsDevelopment() || isSwaggerEnabled)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("LucyAllowConfigured");

app.UseAuthorization();

// GET /health
app.MapGet("/health", () => Results.Ok(new { status = "Healthy", timestamp = DateTime.UtcNow }));

app.MapControllers();

app.Run();

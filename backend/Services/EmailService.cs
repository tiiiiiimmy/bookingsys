using System.Net;
using System.Net.Mail;
using BookingSystem.Backend.Configuration;
using BookingSystem.Backend.Models;

namespace BookingSystem.Backend.Services;

public sealed class EmailService
{
    private readonly EmailSettings _emailSettings;
    private readonly AppSettings _appSettings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(EmailSettings emailSettings, AppSettings appSettings, ILogger<EmailService> logger)
    {
        _emailSettings = emailSettings;
        _appSettings = appSettings;
        _logger = logger;
    }

    public Task SendBookingConfirmedAsync(BookingAdminDetailDto booking, CancellationToken cancellationToken = default)
    {
        var manageLink = BuildManageLink(booking.ManageToken);
        var body = $"""
            您的预约已经确认。

            预约编号：#{booking.Id}
            服务：{booking.ServiceName}
            时间：{booking.StartTime:yyyy-MM-dd HH:mm} - {booking.EndTime:HH:mm}
            价格：${booking.Price}

            如需申请改期，请访问：
            {manageLink}

            如需取消，请联系：{_appSettings.SupportEmail}
            """;

        return SendAsync(booking.CustomerEmail, "预约确认", body, cancellationToken);
    }

    public Task SendAdminNewBookingAsync(BookingAdminDetailDto booking, CancellationToken cancellationToken = default)
    {
        var body = $"""
            您收到一条新预约。

            预约编号：#{booking.Id}
            客户：{booking.CustomerName}
            邮箱：{booking.CustomerEmail}
            电话：{booking.CustomerPhone}
            服务：{booking.ServiceName}
            时间：{booking.StartTime:yyyy-MM-dd HH:mm}
            支付状态：{booking.PaymentStatus}
            """;

        return SendAsync(_appSettings.SupportEmail, "新预约通知", body, cancellationToken);
    }

    public Task SendRescheduleRequestedAsync(ManagedBookingDto booking, RescheduleRequestDto request, CancellationToken cancellationToken = default)
    {
        var customerBody = $"""
            您的改期申请已提交，等待管理员审核。

            预约编号：#{booking.BookingId}
            原时间：{booking.StartTime:yyyy-MM-dd HH:mm}
            申请时间：{request.RequestedStartTime:yyyy-MM-dd HH:mm}

            如需帮助，请联系：{_appSettings.SupportEmail}
            """;

        var adminBody = $"""
            您收到一条改期申请。

            预约编号：#{booking.BookingId}
            客户：{booking.CustomerName}
            原时间：{booking.StartTime:yyyy-MM-dd HH:mm}
            申请时间：{request.RequestedStartTime:yyyy-MM-dd HH:mm}
            客户备注：{request.CustomerNote ?? "无"}
            """;

        return Task.WhenAll(
            SendAsync(booking.CustomerEmail, "改期申请已提交", customerBody, cancellationToken),
            SendAsync(_appSettings.SupportEmail, "新的改期申请", adminBody, cancellationToken));
    }

    public Task SendRescheduleApprovedAsync(BookingAdminDetailDto booking, RescheduleRequestDto request, CancellationToken cancellationToken = default)
    {
        var body = $"""
            您的改期申请已通过。

            预约编号：#{booking.Id}
            新时间：{booking.StartTime:yyyy-MM-dd HH:mm} - {booking.EndTime:HH:mm}
            服务：{booking.ServiceName}

            如需进一步帮助，请联系：{_appSettings.SupportEmail}
            """;

        return SendAsync(booking.CustomerEmail, "改期申请已通过", body, cancellationToken);
    }

    public Task SendRescheduleRejectedAsync(BookingAdminDetailDto booking, RescheduleRequestDto request, CancellationToken cancellationToken = default)
    {
        var body = $"""
            您的改期申请未通过。

            预约编号：#{booking.Id}
            当前预约时间：{booking.StartTime:yyyy-MM-dd HH:mm}
            备注：{request.AdminNote ?? "请联系客服获取更多帮助。"}

            联系邮箱：{_appSettings.SupportEmail}
            """;

        return SendAsync(booking.CustomerEmail, "改期申请未通过", body, cancellationToken);
    }

    public Task SendBookingCancelledAsync(BookingAdminDetailDto booking, CancellationToken cancellationToken = default)
    {
        var body = $"""
            您的预约已被取消。

            预约编号：#{booking.Id}
            服务：{booking.ServiceName}
            原时间：{booking.StartTime:yyyy-MM-dd HH:mm}
            取消原因：{booking.CancellationReason ?? "请联系客服了解详情。"}

            联系邮箱：{_appSettings.SupportEmail}
            """;

        return SendAsync(booking.CustomerEmail, "预约已取消", body, cancellationToken);
    }

    private async Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken)
    {
        if (!_emailSettings.IsConfigured)
        {
            _logger.LogWarning("Email settings are not fully configured. Skipping email to {Recipient}.", to);
            return;
        }

        try
        {
            using var message = new MailMessage(_emailSettings.User!, to, subject, body);
            using var client = new SmtpClient(_emailSettings.Host!, _emailSettings.Port)
            {
                EnableSsl = _emailSettings.Secure,
                Credentials = new NetworkCredential(_emailSettings.User!, _emailSettings.Password!),
            };

            cancellationToken.ThrowIfCancellationRequested();
            await client.SendMailAsync(message, cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Failed to send email to {Recipient}", to);
        }
    }

    private string BuildManageLink(string? manageToken)
    {
        if (string.IsNullOrWhiteSpace(manageToken))
        {
            return _appSettings.AppBaseUrl;
        }

        return $"{_appSettings.AppBaseUrl.TrimEnd('/')}/booking/manage/{manageToken}";
    }
}

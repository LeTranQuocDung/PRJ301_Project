using System;

namespace Lucy.UserPaymentService.Models
{
    public class Wallet
    {
        public int UserId { get; set; }
        public decimal Balance { get; set; }
        public string Currency { get; set; } = "VND";
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class TopupRequest
    {
        public int UserId { get; set; }
        public decimal Amount { get; set; }
        public string Method { get; set; } = string.Empty;
    }

    public class SendGiftRequest
    {
        public int FromUserId { get; set; }
        public int ToMentorId { get; set; }
        public string GiftCode { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }

    public class TransactionResult
    {
        public string TransactionId { get; set; } = string.Empty;
        public int UserId { get; set; }
        public decimal Amount { get; set; }
        public string Method { get; set; } = string.Empty;
        public string Status { get; set; } = "success";
        public decimal NewBalance { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class GiftResult
    {
        public string TransactionId { get; set; } = string.Empty;
        public int FromUserId { get; set; }
        public int ToMentorId { get; set; }
        public string GiftCode { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Status { get; set; } = "success";
        public decimal NewBalance { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}

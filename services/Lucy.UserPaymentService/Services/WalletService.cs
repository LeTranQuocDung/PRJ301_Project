using System;
using System.Collections.Concurrent;
using Lucy.UserPaymentService.Models;

namespace Lucy.UserPaymentService.Services
{
    public interface IWalletService
    {
        Wallet GetWallet(int userId);
        TransactionResult Topup(TopupRequest request);
        GiftResult SendGift(SendGiftRequest request);
    }

    public class WalletService : IWalletService
    {
        private static readonly ConcurrentDictionary<int, Wallet> _wallets = new();

        static WalletService()
        {
            // Seed demo data
            _wallets[1] = new Wallet { UserId = 1, Balance = 150000.0m };
            _wallets[2] = new Wallet { UserId = 2, Balance = 250000.0m };
        }

        public Wallet GetWallet(int userId)
        {
            return _wallets.GetOrAdd(userId, id => new Wallet
            {
                UserId = id,
                Balance = 0.0m
            });
        }

        public TransactionResult Topup(TopupRequest request)
        {
            var wallet = GetWallet(request.UserId);
            wallet.Balance += request.Amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            return new TransactionResult
            {
                TransactionId = $"TXN_NET_TOP_{Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper()}",
                UserId = request.UserId,
                Amount = request.Amount,
                Method = request.Method,
                NewBalance = wallet.Balance
            };
        }

        public GiftResult SendGift(SendGiftRequest request)
        {
            var senderWallet = GetWallet(request.FromUserId);
            if (senderWallet.Balance < request.Amount)
            {
                throw new InvalidOperationException("Insufficient wallet balance.");
            }

            var mentorWallet = GetWallet(request.ToMentorId);

            senderWallet.Balance -= request.Amount;
            senderWallet.UpdatedAt = DateTime.UtcNow;

            mentorWallet.Balance += request.Amount;
            mentorWallet.UpdatedAt = DateTime.UtcNow;

            return new GiftResult
            {
                TransactionId = $"TXN_NET_GIFT_{Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper()}",
                FromUserId = request.FromUserId,
                ToMentorId = request.ToMentorId,
                GiftCode = request.GiftCode,
                Amount = request.Amount,
                NewBalance = senderWallet.Balance
            };
        }
    }
}

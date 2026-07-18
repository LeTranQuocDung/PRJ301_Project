using Microsoft.AspNetCore.Mvc;
using Lucy.UserPaymentService.Models;
using Lucy.UserPaymentService.Services;
using System;

namespace Lucy.UserPaymentService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly IWalletService _walletService;

        public PaymentsController(IWalletService walletService)
        {
            _walletService = walletService;
        }

        [HttpGet("wallet/balance")]
        public IActionResult GetBalance([FromQuery] int userId)
        {
            if (userId <= 0)
            {
                return BadRequest(new { error = "Invalid userId parameter." });
            }

            var wallet = _walletService.GetWallet(userId);
            return Ok(wallet);
        }

        [HttpPost("topup")]
        public IActionResult Topup([FromBody] TopupRequest request)
        {
            if (request.UserId <= 0 || request.Amount <= 0 || string.IsNullOrWhiteSpace(request.Method))
            {
                return BadRequest(new { error = "Validation failed: userId > 0, amount > 0, and method are required." });
            }

            var result = _walletService.Topup(request);
            return Ok(result);
        }

        [HttpPost("gifts/send")]
        public IActionResult SendGift([FromBody] SendGiftRequest request)
        {
            if (request.FromUserId <= 0 || request.ToMentorId <= 0 || string.IsNullOrWhiteSpace(request.GiftCode) || request.Amount <= 0)
            {
                return BadRequest(new { error = "Validation failed: fromUserId > 0, toMentorId > 0, giftCode, and amount > 0 are required." });
            }

            try
            {
                var result = _walletService.SendGift(request);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}

using Microsoft.AspNetCore.Mvc;
using System;

namespace Lucy.UserPaymentService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IdentityController : ControllerBase
    {
        public class TokenRequest
        {
            public string RoomId { get; set; } = string.Empty;
            public string Role { get; set; } = "student";
        }

        [HttpPost("anonymous-token")]
        public IActionResult GenerateAnonymousToken([FromBody] TokenRequest? request)
        {
            var req = request ?? new TokenRequest();
            var secureToken = $"LUCY_ANON_JWT_{Guid.NewGuid().ToString("N").ToUpper()}";
            
            return Ok(new
            {
                token = secureToken,
                role = req.Role,
                roomId = req.RoomId,
                expiresInSeconds = 3600,
                issuedAt = DateTime.UtcNow
            });
        }
    }
}

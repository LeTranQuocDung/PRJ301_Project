const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-token');

const app = express();
app.use(cors());
app.use(express.json());

const APP_ID = 'ca82570aa4a3464aadca4e28ee1d73b9';
const APP_CERTIFICATE = '988c931ccb1c47259f3f4424f3f65ea7';

// GET /api/agora-token?channel=lucy_room_1&uid=0
app.get('/api/agora-token', (req, res) => {
  const channelName = req.query.channel || 'lucy_room_1';
  const uid = parseInt(req.query.uid) || 0;
  const role = RtcRole.PUBLISHER;

  const expirationSeconds = 3600 * 24; // 24 hours
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const expiredTs = currentTimestamp + expirationSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID, APP_CERTIFICATE, channelName, uid, role, expiredTs, expiredTs
  );

  console.log(`[Token Server] New token generated for channel="${channelName}" uid=${uid}`);
  res.json({ token, uid, channel: channelName });
});

app.get('/health', (req, res) => res.json({ status: 'OK', message: 'LUCY Token Server is running!' }));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(` LUCY Token Server running on port ${PORT}`);
  console.log(`========================================`);
});

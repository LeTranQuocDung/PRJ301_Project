const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

dotenv.config();

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: CLIENT_ORIGIN }));

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

const nocache = (req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
};

app.get('/api/agora/token', nocache, (req, res) => {
  res.header('Access-Control-Allow-Origin', CLIENT_ORIGIN);
  
  if (!APP_ID || !APP_CERTIFICATE) {
    return res.status(500).json({ error: 'Agora credentials are not configured' });
  }

  const channelName = req.query.channelName;
  
  if (!channelName) {
    return res.status(400).json({ error: 'channelName is required' });
  }

  let uid = req.query.uid;
  if (!uid || uid === '') {
    uid = 0;
  }
  
  // get role
  let role = RtcRole.SUBSCRIBER;
  if (req.query.role === 'publisher') {
    role = RtcRole.PUBLISHER;
  } else {
    // Default to publisher for this app so everyone can speak
    role = RtcRole.PUBLISHER; 
  }

  const expireTime = req.query.expireTime ? parseInt(req.query.expireTime, 10) : 86400; // default 24h
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  let token;
  try {
    if (req.query.tokentype === 'uid') {
      token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
    } else {
      token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpireTime);
    }
    
    return res.json({ token: token, channelName: channelName, uid: uid });
  } catch (err) {
    console.error('Error generating token:', err);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Agora Token Server listening at http://localhost:${PORT}`);
});

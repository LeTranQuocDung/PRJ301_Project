class AgoraService {
  constructor() {
    this.client = null;
    this.localAudioTrack = null;
    this.isJoined = false;
    this.isMuted = false;
    this.agoraSDK = null;
  }

  async _loadSDK() {
    if (this.agoraSDK) return this.agoraSDK;
    try {
      const module = await import('agora-rtc-sdk-ng');
      this.agoraSDK = module.default || module;
      return this.agoraSDK;
    } catch (err) {
      console.error('[Agora] Failed to load SDK:', err);
      return null;
    }
  }

  async init(appId, codec = 'vp8') {
    if (!appId) {
      console.error('[Agora] AppId is required');
      return false;
    }
    const AgoraRTC = await this._loadSDK();
    if (!AgoraRTC) {
      console.error('[Agora] SDK not available');
      return false;
    }
    // Enable detailed logging for debugging
    AgoraRTC.setLogLevel(0); // 0 = DEBUG
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec });
    console.log('[Agora] Client created successfully');
    return true;
  }

  async joinRoom(appId, channel, token, uid) {
    if (!this.client) {
      console.error('[Agora] Client not initialized, call init() first');
      return null;
    }

    try {
      console.log('[Agora] Joining channel:', channel, 'uid:', uid, 'token length:', token?.length);
      const resultUid = await this.client.join(appId, channel, token, uid);
      this.isJoined = true;
      console.log('[Agora] Successfully joined channel, uid:', resultUid);
      return resultUid;
    } catch (err) {
      console.error('[Agora] Join failed:', err.message || err);
      throw err; // Let caller handle
    }
  }

  async publishAudio() {
    if (!this.client) {
      console.error('[Agora] Cannot publish - client not initialized');
      return;
    }
    const AgoraRTC = await this._loadSDK();
    if (!AgoraRTC) return;

    try {
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      console.log('[Agora] Microphone track created');
      if (this.isMuted) {
        await this.localAudioTrack.setEnabled(false);
      }
      await this.client.publish([this.localAudioTrack]);
      console.log('[Agora] Audio track published successfully');
    } catch (err) {
      console.error('[Agora] publishAudio failed:', err.message || err);
    }
  }

  async toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.localAudioTrack) {
      try {
        await this.localAudioTrack.setEnabled(!this.isMuted);
        console.log('[Agora] Mute toggled:', this.isMuted);
      } catch (err) {
        console.warn('[Agora] Failed to toggle mute:', err);
      }
    }
    return this.isMuted;
  }

  async leaveRoom() {
    this.isJoined = false;
    this.isMuted = false;

    if (this.localAudioTrack) {
      try {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
      } catch (err) {
        console.warn('[Agora] Error closing local audio track:', err);
      }
      this.localAudioTrack = null;
    }

    if (this.client) {
      try {
        await this.client.leave();
        console.log('[Agora] Left channel');
      } catch (err) {
        console.warn('[Agora] Error leaving channel:', err);
      }
    }
  }

  onUserPublished(callback) {
    if (!this.client) {
      console.warn('[Agora] onUserPublished: client not ready');
      return;
    }
    this.client.on('user-published', async (user, mediaType) => {
      console.log('[Agora] Remote user published:', user.uid, 'mediaType:', mediaType);
      try {
        await this.client.subscribe(user, mediaType);
        console.log('[Agora] Subscribed to user:', user.uid, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack.play();
          console.log('[Agora] Playing remote audio from user:', user.uid);
          callback(user);
        }
      } catch (err) {
        console.error('[Agora] Error subscribing to remote user:', err);
      }
    });
  }

  onUserUnpublished(callback) {
    if (!this.client) {
      console.warn('[Agora] onUserUnpublished: client not ready');
      return;
    }
    this.client.on('user-unpublished', (user) => {
      console.log('[Agora] Remote user unpublished:', user.uid);
      callback(user);
    });
  }
}

export const agoraService = new AgoraService();

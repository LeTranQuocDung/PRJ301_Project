class AgoraService {
  constructor() {
    this.client = null;
    this.localAudioTrack = null;
    this.isJoined = false;
    this.isMuted = false;
    this.isFallback = false;
    this.agoraSDK = null;
  }

  async _loadSDK() {
    if (this.agoraSDK) return this.agoraSDK;
    try {
      // Dynamic import to split bundle and optimize performance
      const module = await import('agora-rtc-sdk-ng');
      this.agoraSDK = module.default || module;
      return this.agoraSDK;
    } catch (err) {
      console.warn('Failed to dynamically load Agora RTC Web SDK:', err);
      this.isFallback = true;
      return null;
    }
  }

  async init(appId, codec = 'vp8') {
    try {
      if (!appId) throw new Error('AppId is required');
      const AgoraRTC = await this._loadSDK();
      if (!AgoraRTC) {
        this.isFallback = true;
        return;
      }
      this.client = AgoraRTC.createClient({ mode: 'rtc', codec });
      this.isFallback = false;
    } catch (err) {
      console.warn('Agora Web SDK init failed, falling back to mock mode:', err);
      this.isFallback = true;
    }
  }

  async joinRoom(appId, channel, token, uid) {
    await this._loadSDK();
    if (this.isFallback || !this.client) {
      this.isJoined = true;
      return uid || 12345;
    }

    try {
      const resultUid = await this.client.join(appId, channel, token, uid);
      this.isJoined = true;
      return resultUid;
    } catch (err) {
      console.warn('Agora client join failed, falling back to mock connection:', err);
      this.isFallback = true;
      this.isJoined = true;
      return uid || 12345;
    }
  }

  async publishAudio() {
    const AgoraRTC = await this._loadSDK();
    if (this.isFallback || !this.client || !AgoraRTC) {
      return;
    }

    try {
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      if (this.isMuted) {
        await this.localAudioTrack.setEnabled(false);
      }
      await this.client.publish([this.localAudioTrack]);
    } catch (err) {
      console.warn('Agora publishAudio failed, falling back to simulated microphone:', err);
      this.isFallback = true;
    }
  }

  async toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.localAudioTrack) {
      try {
        await this.localAudioTrack.setEnabled(!this.isMuted);
      } catch (err) {
        console.warn('Failed to toggle audio track mute status:', err);
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
        console.warn('Error closing local audio track:', err);
      }
      this.localAudioTrack = null;
    }

    if (this.client && !this.isFallback) {
      try {
        await this.client.leave();
      } catch (err) {
        console.warn('Error leaving Agora channel:', err);
      }
    }
    this.isFallback = false;
  }

  onUserPublished(callback) {
    if (this.isFallback || !this.client) return;
    this.client.on('user-published', async (user, mediaType) => {
      try {
        await this.client.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack.play();
          callback(user);
        }
      } catch (err) {
        console.warn('Error subscribing to remote user track:', err);
      }
    });
  }

  onUserUnpublished(callback) {
    if (this.isFallback || !this.client) return;
    this.client.on('user-unpublished', (user) => {
      callback(user);
    });
  }
}

export const agoraService = new AgoraService();

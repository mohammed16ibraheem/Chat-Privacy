/**
 * WebRTC Data Channel client for Chat Privacy
 * Uses WebRTC for peer-to-peer messaging
 */

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to: string;
  data: string;
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private signalingUrl: string;
  private username: string;
  private publicKey: string;
  private onMessageCallback?: (message: string) => void;
  private onConnectionStateChange?: (state: string) => void;
  private remoteUsername: string | null = null;

  // STUN servers (free, public)
  private readonly stunServers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  constructor(signalingUrl: string, username: string, publicKey: string) {
    this.signalingUrl = signalingUrl;
    this.username = username;
    this.publicKey = publicKey;
  }

  /**
   * Initialize WebRTC connection
   */
  async initialize(): Promise<void> {
    this.peerConnection = new RTCPeerConnection(this.stunServers);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.remoteUsername) {
        this.sendIceCandidate(event.candidate, this.remoteUsername);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState || 'closed';
      this.onConnectionStateChange?.(state);
      console.log('WebRTC connection state:', state);
    };

    // Handle incoming data channel (when receiving connection)
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      this.setupDataChannel(channel);
    };
  }

  /**
   * Create offer and initiate connection to another user
   */
  async connectToUser(remoteUsername: string): Promise<void> {
    if (!this.peerConnection) {
      await this.initialize();
    }

    this.remoteUsername = remoteUsername;

    // Create data channel
    this.dataChannel = this.peerConnection!.createDataChannel('chat', {
      ordered: true,
    });

    this.setupDataChannel(this.dataChannel);

    // Create offer
    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);

    // Send offer via signaling server
    await this.sendOffer(offer, remoteUsername);
  }

  /**
   * Handle incoming offer from another user
   */
  async handleOffer(offer: RTCSessionDescriptionInit, fromUsername: string): Promise<void> {
    if (!this.peerConnection) {
      await this.initialize();
    }

    this.remoteUsername = fromUsername;

    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));

    // Create answer
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);

    // Send answer via signaling server
    await this.sendAnswer(answer, fromUsername);
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  /**
   * Setup data channel event handlers
   */
  private setupDataChannel(channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log('Data channel opened');
      this.onConnectionStateChange?.('connected');
    };

    channel.onclose = () => {
      console.log('Data channel closed');
      this.onConnectionStateChange?.('closed');
    };

    channel.onerror = (error) => {
      console.error('Data channel error:', error);
    };

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.onMessageCallback?.(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    this.dataChannel = channel;
  }

  /**
   * Send message via data channel
   */
  send(message: any): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
    } else {
      console.error('Data channel not open');
      throw new Error('Data channel not connected');
    }
  }

  /**
   * Send offer via signaling server
   */
  private async sendOffer(offer: RTCSessionDescriptionInit, to: string): Promise<void> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/webrtc/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: this.username,
        to,
        offer: JSON.stringify(offer),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send offer');
    }
  }

  /**
   * Send answer via signaling server
   */
  private async sendAnswer(answer: RTCSessionDescriptionInit, to: string): Promise<void> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/webrtc/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: this.username,
        to,
        answer: JSON.stringify(answer),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send answer');
    }
  }

  /**
   * Send ICE candidate via signaling server
   */
  private async sendIceCandidate(candidate: RTCIceCandidate, to: string): Promise<void> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    await fetch(`${apiUrl}/api/webrtc/ice-candidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: this.username,
        to,
        candidate: JSON.stringify(candidate),
      }),
    });
  }

  /**
   * Set message callback
   */
  onMessage(callback: (message: any) => void): void {
    this.onMessageCallback = callback;
  }

  /**
   * Set connection state change callback
   */
  onConnectionStateChangeCallback(callback: (state: string) => void): void {
    this.onConnectionStateChange = callback;
  }

  /**
   * Close connection
   */
  close(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteUsername = null;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return (
      this.dataChannel !== null &&
      this.dataChannel.readyState === 'open' &&
      this.peerConnection?.connectionState === 'connected'
    );
  }
}


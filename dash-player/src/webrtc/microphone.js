const WebRTCPeerManager = function (pubSubChannel, localUserName, remoteUserName, disconnectCallback) {
  this.pubSubChannel = pubSubChannel
  this.localUserName = localUserName
  this.remoteUserName = remoteUserName

  this.peerConnection = null
  this.localMediaStream = null
  this.remoteAudioStream = null

  this.peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
  })

  // This will be called when connection with peer is negotiated and we receive their
  // audio stream
  //
  this.peerConnection.addEventListener('track', event => {
    this.remoteAudioStream = new MediaStream()
    document.getElementById(`remoteAudio_${this.remoteUserName}`).srcObject = this.remoteAudioStream
    this.remoteAudioStream.addTrack(event.track)
  })

  this.peerConnection.addEventListener('connectionstatechange', event => {
    if (this.peerConnection.connectionState === 'disconnected') {
      console.log(`WebRTC: Cleaning up WebRTC channel to ${this.remoteUserName}, b/c they disconnected...`)

      this.disconnect()

      disconnectCallback(this.remoteUserName)
    }
  })

  // Send our ICE candidates to the peer as they become available
  //
  this.peerConnection.addEventListener('icecandidate', event => {
    if (event.candidate) {
      console.log(`WebRTC: Sending new ICE candidate to ${this.remoteUserName}: ${JSON.stringify(event.candidate)}`)
      this.pubSubChannel.trigger('client-webrtc-signaling', {
        fromUser: this.localUserName,
        toUser:   this.remoteUserName,
        iceCandidate:   event.candidate
      })
    }
  })

  // Add local microphone track to the connection
  //
  this.createLocalMicrophoneTrack()
}

WebRTCPeerManager.prototype.initiateConnectionToUser = function (remoteUserName) {
  return new Promise((resolve, reject) => {
    this.peerConnection.addEventListener('connectionstatechange', event => {
      if (this.peerConnection.connectionState === 'connected') {
        resolve()
      }
    })

    try {
      console.log(`WebRTC: Initiating audio connection to ${this.remoteUserName}...`)
      this.createAndSendSDPOffer()
    }
    catch (e) {
      reject(e)
    }
  })
}

WebRTCPeerManager.prototype.acceptConnectionFromUser = function (offer) {
  return new Promise((resolve, reject) => {
    this.peerConnection.addEventListener('connectionstatechange', event => {
      if (this.peerConnection.connectionState === 'connected') {
        resolve()
      }
    })

    // Answer the offer
    //
    if (offer) {
      if (!this.offerSent) {
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        console.log(`WebRTC: Received an Offer from ${this.remoteUserName}`)
        // console.log(`WebRTC: RemoteDescription on ${this.localUserName} is set to: ${JSON.stringify(offer)}`)

        this.peerConnection.createAnswer().then(answer => {
          this.peerConnection.setLocalDescription(answer).then(() => {
            // console.log(`WebRTC: LocalDescription on ${this.localUserName} is set to: ${JSON.stringify(answer)}`)
            console.log(`WebRTC: Transmitting Answer to ${this.remoteUserName}...`)

            this.pubSubChannel.trigger('client-webrtc-signaling', {
              fromUser: this.localUserName,
              toUser:   this.remoteUserName,
              answer:   answer
            })
          })
        })
      }
      else {
        console.log(`WebRTC: Dropping offer from ${this.remoteUserName}, b/c we have already sent our own offer to them.`)
      }
    }
  })
}

WebRTCPeerManager.prototype.beginTransmittingAudio = function () {
  document.getElementById(`remoteAudio_${this.remoteUserName}`).srcObject = this.localMediaStream
}

WebRTCPeerManager.prototype.createLocalMicrophoneTrack = function () {
  navigator.mediaDevices.getUserMedia({ video: false, audio: true })
    .then(localMediaStream => {
      this.localMediaStream = localMediaStream
      const numOfAudioTracks = this.localMediaStream.getAudioTracks().length
      if (numOfAudioTracks === 1) {
        console.log('WebRTC: Local microphone stream acquired.')
        this.peerConnection.addTrack(this.localMediaStream.getTracks()[0], this.localMediaStream)
      }
      else {
        throw new Error(`Expected 1 audio track, but found ${numOfAudioTracks}`)
      }
    })
}

WebRTCPeerManager.prototype.processSDPMessage = function (message) {
  // Accept the answer
  //
  if (message.answer) {
    this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer))
      .then(() => {
        console.log(`WebRTC: Received Answer from ${message.fromUser}`)
        // console.log(`WebRTC: RemoteDescription from ${message.fromUser} is set:\n${JSON.stringify(message.answer)}`)
      })
  }

  // Add ICE candidate for our peer
  //
  else if (message.iceCandidate) {
    this.peerConnection.addIceCandidate(message.iceCandidate).then(() => {
      console.log(`WebRTC: ICE Candidate from ${message.fromUser} is added: ${JSON.stringify(message.iceCandidate)}`)
    })
  }
}

WebRTCPeerManager.prototype.createAndSendSDPOffer = function () {
  this.peerConnection.createOffer({ offerToReceiveAudio: 1, offerToReceiveVideo: 0 }).then(offer => {
    this.peerConnection.setLocalDescription(offer).then(() => {
      // console.log(`WebRTC: LocalDescription for ${this.localUserName} is set to: ${JSON.stringify(offer)}`)
      console.log(`WebRTC: Transmitting offer to ${this.remoteUserName}...`)

      this.pubSubChannel.trigger('client-webrtc-signaling', {
        fromUser: this.localUserName,
        toUser:   this.remoteUserName,
        offer:    offer
      })

      this.offerSent = true
    })
  })
}

WebRTCPeerManager.prototype.disconnect = function () {
  this.peerConnection.close()
}

export default WebRTCPeerManager

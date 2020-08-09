const WebRTCPeerManager = function (pubSubChannel, localUserName, remoteUserName) {
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
    // document.getElementById(`remoteAudio_${this.remoteUserName}`).srcObject = event.streams[0]
    // this.remoteAudioStream = MediaStream()
    // this.remoteAudioStream.addTrack(event.track)
  })

  // Send our ICE candidates to the peer as they become available
  //
  this.peerConnection.addEventListener('icecandidate', event => {
    if (event.candidate) {
      console.log(`Sending new ICE candidate to ${this.remoteUserName}:\n${JSON.stringify(event.candidate)}`)
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

    this.createAndSendSDPOffer()
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
        console.log(`RemoteDescription on ${this.localUserName} is set to: ${JSON.stringify(offer)}`)

        this.peerConnection.createAnswer().then(answer => {
          this.peerConnection.setLocalDescription(answer).then(() => {
            console.log(`LocalDescription on ${this.localUserName} is set to: ${JSON.stringify(answer)}`)
            console.log(`Transmitting this answer to ${this.remoteUserName}...`)

            this.pubSubChannel.trigger('client-webrtc-signaling', {
              fromUser: this.localUserName,
              toUser:   this.remoteUserName,
              answer:   answer
            })
          })
        })
      }
      else {
        console.log(`Dropping offer from ${this.remoteUserName}, b/c we have already sent our own offer to them.`)
      }
    }
  })
}

WebRTCPeerManager.prototype.createLocalMicrophoneTrack = function () {
  navigator.mediaDevices.getUserMedia({ video: false, audio: true })
    .then(localMediaStream => {
      this.localMediaStream = localMediaStream
      const numOfAudioTracks = this.localMediaStream.getTracks().length
      if (numOfAudioTracks === 1) {
        console.log('Local microphone stream acquired.')
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
        console.log(`RemoteDescription from ${message.fromUser} is set:\n${JSON.stringify(message.answer)}`)
      })
  }

  // Add ICE candidate for our peer
  //
  else if (message.iceCandidate) {
    this.peerConnection.addIceCandidate(message.iceCandidate).then(() => {
      console.log(`ICE Candidate from ${message.fromUser} is added:\n${JSON.stringify(message.iceCandidate)}`)
    })
  }
}

WebRTCPeerManager.prototype.createAndSendSDPOffer = function () {
  this.peerConnection.createOffer({ offerToReceiveAudio: 1, offerToReceiveVideo: 0 }).then(offer => {
    this.peerConnection.setLocalDescription(offer).then(() => {
      console.log(`LocalDescription for ${this.localUserName} is set to: ${JSON.stringify(offer)}`)
      console.log(`Transmitting this offer to ${this.remoteUserName}...`)
      console.log(`ICE State: ${this.peerConnection.iceGatheringState}`)

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

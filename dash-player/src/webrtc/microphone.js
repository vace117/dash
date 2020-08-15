const WebRTCPeerManager = function (pubSubChannel, localUserName, remoteUserName, disconnectCallback) {
  this.pubSubChannel = pubSubChannel
  this.localUserName = localUserName
  this.remoteUserName = remoteUserName

  this.peerConnection = null
  this.remoteAudioStream = null

  this.peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
  })

  // This will be called when connection with peer is negotiated and we receive their
  // audio stream
  //
  this.peerConnection.addEventListener('track', event => {
    console.log(`Received audio stream from ${this.remoteUserName}`)
    this.remoteAudioStream = new MediaStream()
    this.remoteAudioStream.addTrack(event.track)

    const audioTag = document.getElementById(`remoteAudio_${this.remoteUserName}`)
    if (audioTag) {
      this.beginAudioPlayback()
    }
  })

  this.peerConnection.addEventListener('icecandidateerror', error => {
    console.error(`ICE Candidate error: ${JSON.stringify(error)}`)
  })

  this.peerConnection.addEventListener('iceconnectionstatechange', iceState => {
    console.log(`ICE Connection State: ${this.peerConnection.iceConnectionState}`)
  })

  this.peerConnection.addEventListener('connectionstatechange', event => {
    console.log(`Peer connection state: ${this.peerConnection.connectionState}`)
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
        toUser: this.remoteUserName,
        iceCandidate: event.candidate
      })
    }
  })
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

      // Add local microphone track to the connection
      //
      this.createLocalMicrophoneTrack().then(lms => this.createAndSendSDPOffer())
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
        console.log(`WebRTC: Received an Offer from ${this.remoteUserName}`)
        this.peerConnection.setRemoteDescription(offer).then(() => {
          console.log(`WebRTC: RemoteDescription on ${this.localUserName} is set to: ${JSON.stringify(offer)}`)

          // Add local microphone track to the connection
          //
          this.createLocalMicrophoneTrack().then(lms => {
            this.peerConnection.createAnswer().then(answer => {
              this.peerConnection.setLocalDescription(answer).then(() => {
                console.log(`WebRTC: LocalDescription on ${this.localUserName} is set to: ${JSON.stringify(answer)}`)
                console.log(`WebRTC: Transmitting Answer to ${this.remoteUserName}...`)

                this.pubSubChannel.trigger('client-webrtc-signaling', {
                  fromUser: this.localUserName,
                  toUser: this.remoteUserName,
                  answer: answer
                })
              })
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

WebRTCPeerManager.prototype.beginAudioPlayback = function () {
  const audioTag = document.getElementById(`remoteAudio_${this.remoteUserName}`)
  if (!audioTag) {
    const error = new Error(`Cannot play audio from ${this.remoteUserName}, b/c the <audio> does not exist!`)
    console.error(error)
    throw error
  }

  if (!this.remoteAudioStream) {
    console.warn(`${this.remoteUserName} has connected, but we have not yet received any audio streams from them. Waiting...`)
  }

  if (audioTag && this.remoteAudioStream) {
    console.log(`Starting audio playback from ${this.remoteUserName}`)
    document.getElementById(`remoteAudio_${this.remoteUserName}`).srcObject = this.remoteAudioStream
  }
}

WebRTCPeerManager.prototype.createLocalMicrophoneTrack = function () {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      .then(localMediaStream => {
        const numOfAudioTracks = localMediaStream.getAudioTracks().length
        if (numOfAudioTracks === 1) {
          console.log('WebRTC: Local microphone stream acquired.')
          this.peerConnection.addTrack(localMediaStream.getTracks()[0], localMediaStream)
          resolve(localMediaStream)
        }
        else {
          const error = new Error(`Expected 1 audio track, but found ${numOfAudioTracks}`)
          reject(error)
          throw error
        }
      })
  })
}

WebRTCPeerManager.prototype.processSDPMessage = function (message) {
  // Accept the answer
  //
  if (message.answer) {
    this.peerConnection.setRemoteDescription(message.answer)
      .then(() => {
        console.log(`WebRTC: Received Answer from ${message.fromUser}`)
        console.log(`WebRTC: RemoteDescription from ${message.fromUser} is set:\n${JSON.stringify(message.answer)}`)
      })
  }

  // Add ICE candidate for our peer
  //
  else if (message.iceCandidate) {
    this.peerConnection.addIceCandidate(message.iceCandidate)
      .then(() => {
        console.log(`WebRTC: ICE Candidate from ${message.fromUser} is added: ${JSON.stringify(message.iceCandidate)}`)
      })
      .catch(err => console.error(err))
  }
}

WebRTCPeerManager.prototype.createAndSendSDPOffer = function () {
  this.peerConnection.createOffer({
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 0,
    voiceActivityDetection: false
  }).then(offer => {
    this.peerConnection.setLocalDescription(offer).then(() => {
      console.log(`WebRTC: LocalDescription for ${this.localUserName} is set to: ${JSON.stringify(offer)}`)
      console.log(`WebRTC: Transmitting offer to ${this.remoteUserName}...`)

      this.pubSubChannel.trigger('client-webrtc-signaling', {
        fromUser: this.localUserName,
        toUser: this.remoteUserName,
        offer: offer
      })

      this.offerSent = true
    })
  })
}

WebRTCPeerManager.prototype.disconnect = function () {
  this.peerConnection.close()
  clearInterval(this.statsMonitor)
}

// This is no longer used, b/c we can get the same info at 'chrome://webrtc-internals/'
// or 'about:webrtc' in Firefox
//
WebRTCPeerManager.prototype.startStatsMonitor = function () {
  this.statsMonitor = setInterval(() => {
    this.peerConnection.getStats(null).then(stats => {
      let statsOutput = ''

      stats.forEach(report => {
        if (report.type !== 'codec' &&
              report.type !== 'certificate') {
          statsOutput += `<h2>Report: ${report.type}</h3>\n<strong>ID:</strong> ${report.id}<br>\n` +
          `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`

          // Now the statistics for this report; we intentially drop the ones we
          // sorted to the top above
          //
          Object.keys(report).forEach(statName => {
            if (statName !== 'id' && statName !== 'timestamp' && statName !== 'type') {
              statsOutput += `<strong>${statName}:</strong> ${report[statName]}<br>\n`
            }
          })
        }
      })

      document.querySelector('.stats-box').innerHTML = statsOutput
    })
  }, 1000)
}

export default WebRTCPeerManager

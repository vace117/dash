const exec = require('./util/exec').exec;
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

const VIDEO_FILE = readInputFile();
const VIDEO_FILE_BASE = path.parse(VIDEO_FILE).name

// These are selected using data from here: 
// http://www.lighterra.com/papers/videoencodingh264/
//
const BIT_RATE_SETTINGS_PER_RESOLUTION = {
  '1080': {bitrate: '3500k', bufsize: '6000k'},
  '720' : {bitrate: '2200k', bufsize: '4000k'},
  '480' : {bitrate: '1000k', bufsize: '2000k'},
  '360' : {bitrate: '500k',  bufsize: '1000k'},
  '240' : {bitrate: '500k',  bufsize: '1000k'}
}

const ACTION_PLAN = {
  container: {
    repackage: null,
    fragment: null
  },

  video: {
    reencode: null,
    resolution_height: null,
    frame_rate: null
  },

  audio: {
    reencode: null,    
  },

  subtitles: {
    reencode: null
  }
};

(async function () {

  const videoData = await parseVideoDescription(VIDEO_FILE)

  await processContainer(videoData)
  videoData.streams.forEach(s => processStream(s))

  console.log("== Action Plan ==")
  console.log(ACTION_PLAN)

  console.log("== Script ==")
  let command = '#!/bin/bash\n\n'

  if ( ACTION_PLAN.container.repackage || ACTION_PLAN.video.reencode || ACTION_PLAN.audio.reencode ) {
    command += `ffmpeg -y -i '${VIDEO_FILE}' \\
   ${generateEncodeParameters()} \\
   '${VIDEO_FILE_BASE}_out.mp4'`
  }

  if ( ACTION_PLAN.container.fragment ) {
    // TODO: Fragment
  }

  console.log(command)
  fs.writeFileSync(`${VIDEO_FILE_BASE}.sh`, command)
  fs.chmodSync(`${VIDEO_FILE_BASE}.sh`, '755')
})();

function generateEncodeParameters() {
  if ( ACTION_PLAN.container.repackage && !ACTION_PLAN.video.reencode && !ACTION_PLAN.audio.reencode ) {
    return '-codec copy '
  }
  else {
    return `${generateVideoParameters()} \\\n   ${generateAudioParameters()}`
  }
}

function generateVideoParameters() {
  let encodeParameters = ''

  if ( ACTION_PLAN.video.reencode ) {
    const frameRate = Math.ceil(eval(ACTION_PLAN.video.frame_rate))
    const gop = frameRate * 5 // I-frame every 5 seconds
    const bitRateSetting = BIT_RATE_SETTINGS_PER_RESOLUTION[ACTION_PLAN.video.resolution_height]

    encodeParameters += '-c:v libx264 -preset ultrafast '
    encodeParameters += '-movflags faststart '
    encodeParameters += `-flags +cgop -g ${gop} -sc_threshold 0 `
    encodeParameters += `-x264opts 'keyint=${gop}:min-keyint=${gop}:no-scenecut' `
    encodeParameters += `-b:v ${bitRateSetting.bitrate} `
    encodeParameters += `-maxrate ${bitRateSetting.bitrate} `
    encodeParameters += `-bufsize ${bitRateSetting.bufsize} `
    //encodeParameters += `-vstats_file '${VIDEO_FILE_BASE}_vstats.txt' `
  }
  else {
    encodeParameters += '-c:v copy '
  }

  return encodeParameters
}

function generateAudioParameters() {
  let encodeParameters = ''

  if ( ACTION_PLAN.audio.reencode ) {
    encodeParameters += `-c:a libfdk_aac -b:a 128k `
  }
  else {
    encodeParameters += '-c:a copy '
  }

  return encodeParameters
}

async function processContainer (videoData) {
  const result = analyzeContainerFormat(videoData)
  console.log(`Container: '${videoData.format.format_long_name}'..... ${result}`)

  if ( result === OK ) {
    console.log(`   - MP4 Fragmentation: ${await analyzeContainerFragmentation()}\n`)
  }
  else {
    console.log('')
  }
}

async function analyzeContainerFragmentation () {
  if ( await isMP4Fragmented(VIDEO_FILE) ) {
    ACTION_PLAN.container.fragment = false
    return ok()
  }
  else {
    ACTION_PLAN.container.fragment = true
    return chalk.yellowBright("No good. MP4 requires fragmentation...")
  }
    
}


function processStream (stream) {
  console.log(`${describeStream(stream)}: ${stream.codec_name}..... ${analyzeStream(stream)}\n`)
}

function describeStream (stream) {
  return `${getFriendlyStreamDescription(stream)} ${stream.index}${getStreamTitle(stream)}`
}

function getStreamTitle (stream) {
  return (stream.tags && stream.tags.title) ? ` (${stream.tags.title})` : ''
}

function getFriendlyStreamDescription (stream) {
  const description = {
    'video': 'Video',
    'audio': 'Audio',
    'subtitle': 'Subtitles'
  }[stream.codec_type]

  return description ? description : 'Unknown Stream'
}

function analyzeStream (stream) {
  const analyzer = {
    'video': analyzeVideoStream,
    'audio': analyzeAudioStream,
    'subtitle': analyzeSubtitleStream
  }[stream.codec_type]

  return analyzer ? analyzer(stream) : ''
}

function analyzeContainerFormat (videoData) {
  if ( videoData.format.format_name.includes("mp4") ) {
    ACTION_PLAN.container.repackage = false
    return ok()
  }
  else {
    ACTION_PLAN.container.repackage = true
    ACTION_PLAN.container.fragment = true
    return chalk.yellowBright("No good. Container will need to be changed to MP4...")
  }
}

function analyzeVideoStream (videoStream) {
  if ( videoStream.codec_name == 'h264' ) {
    ACTION_PLAN.video.reencode = false
    return ok()
  }
  else {
    ACTION_PLAN.video.reencode = true
    ACTION_PLAN.container.repackage = true
    ACTION_PLAN.container.fragment = true
    ACTION_PLAN.video.resolution_height = videoStream.height
    ACTION_PLAN.video.frame_rate = videoStream.avg_frame_rate
    return chalk.yellowBright("No good. Video needs re-encoding to h264...")
  }
    
}

function analyzeAudioStream (audioStream) {
  if ( audioStream.codec_name == 'aac' ) {
    ACTION_PLAN.audio.reencode = false
    return ok()
  } 
  else {
    ACTION_PLAN.audio.reencode = true
    return chalk.yellowBright("No good. Audio needs re-encoding to AAC...")
  }
    
}

function analyzeSubtitleStream () {
  ACTION_PLAN.subtitles.reencode = true
  return chalk.yellowBright("Must be converted to WebVTT...")
}

const OK = chalk.greenBright("OK!")

function ok () {
  return OK
}

function readInputFile () {
  return require('yargs').help(false).version(false)
    .usage('Usage: $0 [input video file]')
    .demandCommand(1, 1)
    .argv
    ._[0];
}

async function parseVideoDescription (videoFile) {
  return JSON.parse(
    (await exec(
      `ffprobe -v quiet -print_format json -show_format -show_streams '${videoFile}'`,
    )).stdout
  )
}

async function isMP4Fragmented (videoFile) {
  const mp4info = JSON.parse(
    (await exec(
      `mp4info --format json '${videoFile}'`,
    )).stdout
  )

  return mp4info.movie.fragments
}
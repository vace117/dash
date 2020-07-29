const exec = require('./util/exec').exec;
const chalk = require('chalk');

const VIDEO_FILE = readInputFile();

(async function () {

  const videoData = await parseVideoDescription(VIDEO_FILE)

  await processContainer(videoData)
  videoData.streams.forEach(s => processStream(s))

})();

async function processContainer (videoData) {
  const result = analyzeContainerFormat(videoData)
  console.log(`Container: '${videoData.format.format_long_name}'..... ${result}`)

  if ( result === OK ) {
    console.log(`   MP4 Fragmentation: ${await analyzeContainerFragmentation()}\n`)
  }
  else {
    console.log('')
  }
}

async function analyzeContainerFragmentation () {
  return (await isMP4Fragmented(VIDEO_FILE)) ? ok() :
    chalk.yellowBright("No good. MP4 requires fragmentation...")
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
  return videoData.format.format_name.includes("mp4") ? ok() :
    chalk.yellowBright("No good. Container will need to be changed to MP4...")
}

function analyzeVideoStream (videoStream) {
  return videoStream.codec_name == 'h264' ? ok() :
    chalk.yellowBright("No good. Video needs re-encoding to h264...")
}

function analyzeAudioStream (audioStream) {
  return audioStream.codec_name == 'aac' ? ok() :
    chalk.yellowBright("No good. Audio needs re-encoding to AAC...")
}

function analyzeSubtitleStream () {
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
    ._;
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
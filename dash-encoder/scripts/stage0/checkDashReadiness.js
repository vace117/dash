const exec = require('./util/exec').exec;
const chalk = require('chalk');


(async function() {

    const VIDEO_FILE = readInputFile();
    const videoData = await parseVideoDescription(VIDEO_FILE)

    processContainer(videoData)
    videoData.streams.forEach( s => processStream(s) )    

})();

function processContainer(videoData) {
    console.log(`Container: '${videoData.format.format_long_name}'..... ${analyzeContainerFormat(videoData)}\n`)
    // TODO: If container was OK, check if the MP4 is fragmented using 'mp4fragment' utility

}

function processStream(stream) {
    console.log(`${describeStream(stream)}: ${stream.codec_name}..... ${analyzeStream(stream)}\n`)
}

function describeStream(stream) {
    return `${getFriendlyStreamDescription(stream)} ${stream.index}${getStreamTitle(stream)}`
}

function getStreamTitle(stream) {
    return (stream.tags && stream.tags.title) ? ` (${stream.tags.title})` : ''
}

function getFriendlyStreamDescription(stream) {
    const description = {
        'video'   : 'Video',
        'audio'   : 'Audio',
        'subtitle': 'Subtitles'
    }[stream.codec_type]

    return description ? description : 'Unknown Stream'
}

function analyzeStream(stream) {    
    const analyzer = {
        'video'   : analyzeVideoStream,
        'audio'   : analyzeAudioStream,
        'subtitle': analyzeSubtitleStream
    }[stream.codec_type]

    return analyzer ? analyzer(stream) : ''
}

function analyzeContainerFormat(videoData) {
    return videoData.format.format_name.includes("mp4") ? ok() :
        chalk.yellowBright("No good. Container will need to be changed to MP4...")
}

function analyzeVideoStream(videoStream) {
    return videoStream.codec_name == 'h264' ? ok() :
        chalk.yellowBright("No good. Video needs re-encoding to h264...")
}

function analyzeAudioStream(audioStream) {
    return audioStream.codec_name == 'aac' ? ok() :
        chalk.yellowBright("No good. Audio needs re-encoding to AAC...")
}

function analyzeSubtitleStream(subStream) {
    return chalk.yellowBright("Must be converted to WebVTT...")
}

function ok() {
    return chalk.greenBright("OK!")
}

function readInputFile() {
    return require('yargs').help(false).version(false)
        .usage('Usage: $0 [input video file]')
        .demandCommand(1)
        .argv
        ._;
}

async function parseVideoDescription(VIDEO_FILE) {
    return JSON.parse( 
        (await exec(
            `ffprobe -v quiet -print_format json -show_format -show_streams '${VIDEO_FILE}'`,
        )).stdout
    )
}
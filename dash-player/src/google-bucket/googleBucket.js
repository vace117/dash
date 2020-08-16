const BUCKET_NAME = 'dash-video-storage'
const MPD_SUFFIX = '/stream.mpd'

export default {
  json_endpoint: `https://www.googleapis.com/storage/v1/b/${BUCKET_NAME}/o`,
  file_endpoint: `https://storage.googleapis.com/${BUCKET_NAME}/`,

  getVideoTitle (videoUrl) {
    return videoUrl
      .replace(this.file_endpoint, '')
      .replace(MPD_SUFFIX, '')
  },

  appendMPD (videoTitle) {
    return decodeURIComponent(videoTitle).concat(MPD_SUFFIX)
  }
}

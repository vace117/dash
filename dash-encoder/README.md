# Build Encoder Image
```text
docker build -t vace117/dash-encoder .
```

# Run Encoder Image
```text
./runEncoder.sh
```

All of the commands below should be executed from the Docker image.

# Creating a DASH Presentation
## Single Video File
```text
$ generateEncoderBash.sh [-o output_dir] <input_video.mp4>
$ ./input_video.sh
```
This generates the BASH file with all the commands for you, and then you run it.

## Directory of Video Files
```text
$ cd <input_dir>
$ ls | parallel -q generateEncoderBash.sh [-o output_dir] :::
$ ls *.sh | parallel --progress bash :::
```
This generates BASH files for each video and then you run them all using a worker pool with number of threads equal to the number of cores you have on your CPU.

# Upload DASH Presentations
Find the target path by getting the current listing from the bucket:
```text
$ uploadDashPresentations.sh <local_dir> [<target_path_in_google_bucket>]
```

If you run this command w/o the 2nd parameter, it will list the existing videos in the Google bucket to help you figure out what `<target_path_in_google_bucket>` should be.

## Example Upload
```text
$ uploadDashPresentations.sh '03 True Strength Builder 1' '/Yoga/Dylan Werner/03 True Strength Builder 1'
```


# Supporting info
## Transcoding to MP4
Our video must be packaged inside an MP4 container, that contains:
* H264 Video
* AAC Audio

In order encode to check what your input has, run:
```text
$ generateEncoderBash.sh <input video file>
```

This will tell you what you need to know and generate a BASH file with all the commands for you.

# Encoding Video to h264
If your input video is not already encoded in `h264`, you must re-encode it.

# Creating fragmented MP4 files
Fast method that does not re-encode the file:
```text
mp4fragment in.mp4 out.mp4
```

# Encoding multiple quality streams
Source: https://blog.streamroot.io/encode-multi-bitrate-videos-mpeg-dash-mse-based-media-players/

GOP (Group of Pictures) Explanation: https://kvssoft.wordpress.com/2015/01/28/mpeg-dash-gop/

```text
ffmpeg -y -i 720p.mp4 -c:a libfdk_aac -ac 2 -ab 128k -c:v libx264 -x264opts 'keyint=24:min-keyint=24:no-scenecut' -b:v 1200k -maxrate 1200k -bufsize 1000k -vf "scale=-1:720" outputfile720.mp4
```

```text
ffmpeg -y -i 720p.mp4 -c:a libfdk_aac -ac 2 -ab 128k -c:v libx264 -x264opts 'keyint=24:min-keyint=24:no-scenecut' -b:v 800k -maxrate 800k -bufsize 500k -vf "scale=-1:540" outputfile540.mp4
```

```text
ffmpeg -y -i 720p.mp4 -c:a libfdk_aac -ac 2 -ab 128k -c:v libx264 -x264opts 'keyint=24:min-keyint=24:no-scenecut' -b:v 400k -maxrate 400k -bufsize 400k -vf "scale=-1:360" outputfile360.mp4
```


# Extract Subtitles to SRT
ffmpeg -txt_format text -i in.mkv subs.vtt

# Lossless Repackage to MP4
ffmpeg -i in.mkv -codec copy out.mp4

# Lossless Video, encode audio to AAC
ffmpeg -i in.mkv -c:a libfdk_aac -b:a 128k -c:v copy out.mp4

# Create DASH presentation
mp4dash fragmented_in.mp4 [+format=webvtt,+language=eng]subs.vtt -o out_dir

# Reference player
Use this to test results by pointing at the Apache server (`'dash-server'` image):

http://reference.dashif.org/dash.js/v3.1.1/samples/dash-if-reference-player/index.html

# Resources
## Explanation of DASH
https://www.bento4.com/developers/dash/

## Subtitles + DASH
https://www.bento4.com/developers/dash/subtitles/

## Bento4 Commands Documentation
https://www.bento4.com/documentation/
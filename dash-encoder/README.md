# Explanation of DASH
https://www.bento4.com/developers/dash/

# Build Encoder Image
```text
docker build -t vace117/dash-encoder .
```

# Run Encoder Image
```text
./runEncoder.sh
```

All of the commands below should be executed from the Docker image.

# Creating fragmented MP4 files
Fast method that does not re-encode the file:
```text
mp4fragment in.mp4 out.mp4
```

 OR

Full re-encode:
```text
ffmpeg -in.mp4 -movflags frag_keyframe+empty_moov+default_base_moof out.mp4
```

# Encoding multiple quality streams
Source: https://blog.streamroot.io/encode-multi-bitrate-videos-mpeg-dash-mse-based-media-players/

```text
ffmpeg -y -i 720p.mp4 -c:a libfdk_aac -ac 2 -ab 128k -c:v libx264 -x264opts 'keyint=24:min-keyint=24:no-scenecut' -b:v 1200k -maxrate 1200k -bufsize 1000k -vf "scale=-1:720" outputfile720.mp4
```

```text
ffmpeg -y -i 720p.mp4 -c:a libfdk_aac -ac 2 -ab 128k -c:v libx264 -x264opts 'keyint=24:min-keyint=24:no-scenecut' -b:v 800k -maxrate 800k -bufsize 500k -vf "scale=-1:540" outputfile540.mp4
```

```text
ffmpeg -y -i 720p.mp4 -c:a libfdk_aac -ac 2 -ab 128k -c:v libx264 -x264opts 'keyint=24:min-keyint=24:no-scenecut' -b:v 400k -maxrate 400k -bufsize 400k -vf "scale=-1:360" outputfile360.mp4
```

# Reference player
Use this to test results by pointing at the Apache server (`'dash-server'` image):

http://reference.dashif.org/dash.js/v3.1.1/samples/dash-if-reference-player/index.html


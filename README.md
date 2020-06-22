# Experimenting with DASH

So far we have Proof-of-Concept for all 3 components:
* DASH Encoder
* DASH Server
* DASH Player

The idea is to use the Encoder image to convert videos to single or multiple quality streams, and then use the Apache server to serve up the resulting `output` directory. The Apache image is already configured to server DASH content properly.

Finally the player is using dash.js player to play the resulting video, although it is also possible to use the much more sophisticated reference implementation to play the video as well:

http://reference.dashif.org/dash.js/v3.1.1/samples/dash-if-reference-player/index.html

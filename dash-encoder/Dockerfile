# Docker file used to create an environment with which to build a release

FROM ubuntu:bionic

# Install Dependencies
# Upgrade any ubuntu packages
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    build-essential \
    cmake \
    python3 \
    python3-pip \
    git &&\
    pip3 install invoke &&\
    update-alternatives --install /usr/bin/python python /usr/bin/python3 1 &&\
    update-alternatives --set python /usr/bin/python3

RUN apt-get install -y vim tree

RUN apt-get install -y \
                autoconf \
                automake \
                libass-dev \
                libfreetype6-dev \
                libgnutls28-dev \
                libsdl2-dev \
                libtool \
                libva-dev \
                libvdpau-dev \
                libvorbis-dev \
                libxcb1-dev \
                libxcb-shm0-dev \
                libxcb-xfixes0-dev \
                pkg-config \
                texinfo \
                wget \
                yasm \
                zlib1g-dev \
                nasm \
                libmp3lame-dev \
                libtheora-dev \
                libx264-dev \
                libx265-dev libnuma-dev \
                libvpx-dev \
                libfdk-aac-dev \
                libopus-dev  

RUN apt-get install -y \
                libunistring-dev

# Add a user
ARG USER=dash
ARG UID=1000
ARG GID=1000
RUN useradd -m ${USER} --uid=${UID}

# Run as the user we have setup
USER ${UID}:${GID}
WORKDIR /home/${USER}

########################################
# Install Bento4
########################################

# Compile Bento4
RUN git clone --depth 1 https://github.com/axiomatic-systems/Bento4.git Bento4_Build \
 && cd Bento4_Build \
 && cmake -DCMAKE_BUILD_TYPE=Release \
 && make

# Create the DASH SDK
RUN cd Bento4_Build && ln -s Build/Targets/ cmakebuild \
 && python3 Scripts/SdkPackager.py x86_64-unknown-linux . cmake \
 && mkdir ~/Bento4 \
 && mv SDK/Bento4-SDK-*.x86_64-unknown-linux/* ~/Bento4 \
 && cp mp4* aac2mp4 avcinfo ~/Bento4/bin

# Setup environment variables
ENV PATH=~/Bento4/bin:${PATH}

########################################
# Install ffmpeg
########################################
ARG HOME="/home/${USER}"
ARG FFMPEG_BUILD_DIR="$HOME/ffmpeg_build/BUILD_DIR"
ARG FFMPEG_DIR="$HOME/ffmpeg"
ENV PKG_CONFIG_PATH="${FFMPEG_BUILD_DIR}/lib/pkgconfig"

RUN git clone --depth 1 https://git.ffmpeg.org/ffmpeg.git ffmpeg_build

RUN mkdir -p ${PKG_CONFIG_PATH} \
 && cd "${FFMPEG_BUILD_DIR}/.." \
 && ./configure \
  --prefix=${FFMPEG_BUILD_DIR} \
  --pkg-config-flags="--static" \
  --extra-cflags="-I${FFMPEG_BUILD_DIR}/include" \
  --extra-ldflags="-L$${FFMPEG_BUILD_DIR}/lib" \
  --extra-libs="-lpthread -lm" \
  --bindir="${FFMPEG_DIR}/bin" \
  --enable-gpl \
  --enable-gnutls \
  --enable-libass \
  --enable-libfdk-aac \
  --enable-libfreetype \
  --enable-libmp3lame \
  --enable-libopus \
  --enable-libvorbis \
  --enable-libvpx \
  --enable-libx264 \
  --enable-libx265 \
  --enable-nonfree

RUN cd "${FFMPEG_BUILD_DIR}/.." \
 && make

RUN cd "${FFMPEG_BUILD_DIR}/.." \
 && make install

ENV PATH=${FFMPEG_DIR}/bin:${PATH}

CMD ["bash"]

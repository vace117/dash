# Docker file used to create an environment with which to build a release

FROM ubuntu:bionic

# Install Dependencies
# Upgrade any ubuntu packages
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    build-essential \
    cmake \
    python3 \
    python3-pip \
    git \
    vim tree sudo \
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
    libopus-dev \
    libzvbi-dev \
    libunistring-dev \    
    && pip3 install invoke \
    && update-alternatives --install /usr/bin/python python /usr/bin/python3 1 \
    && update-alternatives --set python /usr/bin/python3


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

RUN git clone --depth 1 https://git.ffmpeg.org/ffmpeg.git ffmpeg_build \
 && mkdir -p ${PKG_CONFIG_PATH} \
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
        --enable-nonfree \
        --enable-libzvbi \
 && make \
 && make install

ENV PATH=${FFMPEG_DIR}/bin:${PATH}

# ########################################
# # Install Groovy
# ########################################
# USER root
# RUN apt-get install -y openjdk-8-jre-headless groovy \
#  && ln -s /usr/lib/jvm/java-8-openjdk-amd64 /usr/lib/jvm/default-java
# USER ${UID}:${GID}

########################################
# Install NodeJS
########################################
USER root
RUN wget -q -O- https://deb.nodesource.com/setup_12.x | bash - \
 && apt-get install -y nodejs
USER ${UID}:${GID}

########################################
# Install Parallel
########################################
USER root
RUN apt-get install -y parallel
USER ${UID}:${GID}

########################################
# Install GCloud utils
########################################
USER root
RUN apt-get update && apt-get install -y curl \
 && curl https://sdk.cloud.google.com | bash \
 && chown -R "${USER}:${USER}" "/home/${USER}/.config"

USER ${UID}:${GID}
RUN echo ". /home/${USER}/google-cloud-sdk/completion.bash.inc" >> "/home/${USER}/.bashrc"
RUN echo ". /home/${USER}/google-cloud-sdk/path.bash.inc"       >> "/home/${USER}/.bashrc"

########################################
# Install Custom Helper Scripts
########################################
USER root
ARG CUSTOM_SCRIPTS=${HOME}/custom_scripts
RUN mkdir ${CUSTOM_SCRIPTS}

ADD scripts/stage0 ${CUSTOM_SCRIPTS}/stage0
WORKDIR ${CUSTOM_SCRIPTS}/stage0
RUN npm install
ENV PATH=${CUSTOM_SCRIPTS}/stage0:${PATH}

########################################
# Upgrade python to 3.7, b/c BentoBox needs that
########################################
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    python3.7 \
    && rm /usr/bin/python3 \
    && ln -s /usr/bin/python3.7 /usr/bin/python3 \
    && python3 -V

########################################
# Setup user and dir
########################################
USER ${UID}:${GID}
WORKDIR /mnt/video
CMD ["bash"]

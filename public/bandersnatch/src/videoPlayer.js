class VideoMediaPlayer {
    constructor({ manifestJSON, network, videoComponent }) {
        this.manifestJSON = manifestJSON
        this.network = network
        this.videoComponent = videoComponent

        this.videoElement = null
        this.sourceBuffer = null
        this.selected = {}
        this.videoDuration = 0
        this.selections = []
    }

    initializeCodec() {
        this.videoElement = document.getElementById("vid")
        const mediaSourceSupported = !!window.MediaSource
        if(!mediaSourceSupported) {
            alert("Seu broeser ou sistema nao tem suporte a MSE!")
            return;
        }

        const codecSupported = MediaSource.isTypeSupported(this.manifestJSON.codec)
        if(!codecSupported) {
            alert(`Seu browser nao suporta o codec: ${this.manifestJSON.codec}`)
            return;
        }

        const mediaSource = new MediaSource()
        this.videoElement.src = URL.createObjectURL(mediaSource)

        mediaSource.addWventListener("sourceopen", this.sourceOpenWrapper(mediaSource))
    }

    sourceOpenWrapper(mediaSource) {
        return async() => {
            this.sourceBuffer = mediaSource.addSourceBuffer(this.manifestJSON.codec)
            const selected = this.selected = this.manifestJSON.intro

            // evita rodar como "LIVE"
            mediaSource.duration = this.videoDuration
            await this.fileDownload(selected.url)
            this.waitForQuestions()
            setInterval(this.waitForQuestions.bind(this), 200)
        }
    }

    waitForQuestions() {
        const currenTime = parseInt(this.videoElement.currentTime)
        this.videoComponent.configureModal(this.selected.options)
    }

    async fileDownload(url) {
        const prepareUrl = {
            url,
            fileResolution: 360,
            fileResolutionTag: this.manifestJSON.fileResolutionTag,
            hostTag: this.manifestJSON.hostTag
        }
        const finalUrl = this.network.parseManifestURL(prepareUrl)
        this.setVideoPlayerDuration(finalUrl)
        const data = await this.network.fetchFile(finalUrl)
        return this.processBufferSegments(data)
    }

    setVideoPlayerDuration() {
        const bars = finalUrl.split('/')
        const [ name, videoDuration] = bars[bars.length - 1].split('-')
        this.videoDuration += videoDuration
    }

    async processBufferSegments(allSegments) {
        const sourceBuffer = this.sourceBuffer
        sourceBuffer.appendBuffer(allSegments)

        return new Promise((resolve, reject) => {
            const updateEnd = () => {
                sourceBuffer.removeEventListener("updateend", updateEnd)
                sourceBuffer.timestampOffset = this.videoDuration

                return resolve()
            }

            sourceBuffer.addEventListener("updateend", () => {})
            sourceBuffer.addEventListener("error", reject)
        })
    }
}
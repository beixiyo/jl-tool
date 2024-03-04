/**
 * 语音播放
 * @example
 * const speaker = new Speaker('你好')
 * speaker.play()
 */
export class Speaker {
    /** 默认播放语音名称 */
    voiceName = 'Microsoft Kangkang - Chinese (Simplified, PRC)'
    /** 可播放语音列表 */
    voiceArr: SpeechSynthesisVoice[] = []
    /** 内部操作的实例对象 */
    speak = new SpeechSynthesisUtterance()

    private initVoice = () => {
        this.voiceArr = speechSynthesis.getVoices()
        const index = this.voiceArr.findIndex(i => i.name === this.voiceName)
        index !== -1 && this.setVoice(index)
    }

    constructor(txt = '', volume = 1, lang = 'zh-CN') {
        this.speak.text = txt
        this.speak.volume = volume
        this.speak.lang = lang

        this.init()
    }

    /** 添加所有能用的声音 */
    private init() {
        speechSynthesis.addEventListener('voiceschanged', this.initVoice)
    }

    /**
     * 播放声音
     * @param onEnd 声音播放完毕的回调
     */
    play(onEnd?: (e: SpeechSynthesisEvent) => void) {
        this.stop()
        speechSynthesis.speak(this.speak)

        onEnd && (this.speak.onend = onEnd)
    }

    /** 停止 */
    stop() {
        speechSynthesis.cancel()
    }

    /** 暂停 */
    pause() {
        speechSynthesis.pause()
    }

    /** 继续 */
    resume() {
        speechSynthesis.resume()
    }

    /** 设置播放文本 */
    setText(txt = '') {
        this.speak.text = txt
    }

    /** 设置音量 */
    setVolume(volume = 1) {
        if (volume < 0 || volume > 1) {
            return this.warn()
        }
        this.speak.volume = volume
    }

    /** 设置声音类型 */
    setVoice(index: number) {
        if (index < 0) {
            return this.warn(0, 99999)
        }
        this.speak.voice = this.voiceArr[index % this.voiceArr.length]
    }

    /** 设置语速 */
    setRate(rate: number) {
        if (rate < 0 || rate > 1) {
            return this.warn()
        }
        this.speak.rate = rate
    }

    /** 设置音高 */
    setPitch(pitch: number) {
        if (pitch < 0 || pitch > 2) {
            return this.warn(0, 2)
        }
        this.speak.pitch = pitch
    }

    private warn(min = 0, max = 1) {
        console.warn(
            `%cSpeak:%c 值必须在 ${min} ~ ${max} 之间`,
            'background-color: #14c9fc; color: #fff; padding: 2px 4px; border-radius: 5px',
            'color: #e07f52'
        )
    }
}

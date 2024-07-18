/**
 * 语音播放
 * @example
 * ```ts
 * const speaker = new Speaker('你好')
 * speaker.play()
 * ```
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
        return this
    }

    /** 停止 */
    stop() {
        speechSynthesis.cancel()
        return this
    }

    /** 暂停 */
    pause() {
        speechSynthesis.pause()
        return this
    }

    /** 继续 */
    resume() {
        speechSynthesis.resume()
        return this
    }

    /** 设置播放文本 */
    setText(txt = '') {
        this.speak.text = txt
        return this
    }

    /** 设置音量 */
    setVolume(volume = 1) {
        this.speak.volume = volume
        return this
    }

    /** 设置声音类型 */
    setVoice(index: number) {
        if (index < 0) {
            return
        }
        this.speak.voice = this.voiceArr[index % this.voiceArr.length]
        return this
    }

    /** 设置语速 */
    setRate(rate: number) {
        this.speak.rate = rate
        return this
    }

    /** 设置音高 */
    setPitch(pitch: number) {
        this.speak.pitch = pitch
        return this
    }
}

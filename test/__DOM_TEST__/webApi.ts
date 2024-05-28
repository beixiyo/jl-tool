import { Recorder, Speaker, openCamera, screenCAP, SpeakToTxt } from '@deb/webApi'


const speakBtn = createBtn('文字转语音', 'speak-btn'),
    recordBtn = createBtn('录音', 'record-btn'),
    stopRecordBtn = createBtn('停止录音', 'stopRecordBtn'),
    playRecordBtn = createBtn('播放录音', 'playRecordBtn'),
    speakTxtBtn = createBtn('语音转文字', 'speakTxtBtn')

document.body.append(
    speakBtn,
    recordBtn,
    stopRecordBtn,
    playRecordBtn,
    speakTxtBtn
);


/** 语音转文字 */
(() => {
    const speakToTxt = new SpeakToTxt((txt) => {
        console.log(txt)
    })
    speakTxtBtn.onclick = () => speakToTxt.start()
})();


/** 文字转语音 */
(() => {
    const speaker = new Speaker(`
        今天是个好日子，
        今天是个好日子，
    `)
    speaker.setRate(2.8)
    speakBtn.onclick = () => speaker.play()
})();


/** 录音测试 */
(async () => {
    const recorder = new Recorder((url, blob) => {
        console.log(url, blob)
    })
    await recorder.init()

    recordBtn.onclick = () => recorder.start()
    stopRecordBtn.onclick = () => recorder.stop()
    playRecordBtn.onclick = () => recorder.play()
})();


/**摄像头测试 */
(() => {
    const video = document.createElement('video')
    const playVideoBtn = createBtn('播放摄像头', 'playVideoBtn')
    const stopVideoBtn = createBtn('关闭摄像头', 'stopVideoBtn')
    document.body.append(video, playVideoBtn, stopVideoBtn)

    playVideoBtn.onclick = async () => {
        const stop = await openCamera(video)

        stopVideoBtn.onclick = () => {
            console.log(stop)
            stop()
        }
    }
})();


/** 录屏测试 */
(() => {
    const screenCapBtn = createBtn('录屏', 'screenCaptBtn')
    document.body.append(screenCapBtn)
    screenCapBtn.onclick = () => screenCAP('test')
})()




function createBtn(content: string, className: string) {
    const btn = document.createElement('button')
    btn.innerText = content
    btn.className = className

    return btn
}

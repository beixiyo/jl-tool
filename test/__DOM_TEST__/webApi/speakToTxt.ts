import { SpeakToTxt } from '@/webApi'

/**
 * 语音转文字功能测试
 */
export function initSpeakToTxtTest() {
  const container = document.createElement('div')
  container.className = 'bg-white rounded-lg shadow-lg p-6 mb-6'

  const title = document.createElement('h2')
  title.className = 'text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-purple-500'
  title.textContent = '🎙️ 语音转文字测试'

  const description = document.createElement('p')
  description.className = 'text-gray-600 mb-4'
  description.textContent = '测试语音识别功能，将语音转换为文字（需要 Chrome 或 Edge 浏览器）'

  const controls = document.createElement('div')
  controls.className = 'flex flex-wrap gap-3 mb-4'

  const startBtn = document.createElement('button')
  startBtn.className = 'px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors'
  startBtn.textContent = '开始识别'

  const stopBtn = document.createElement('button')
  stopBtn.className = 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
  stopBtn.textContent = '停止识别'
  stopBtn.disabled = true

  controls.append(startBtn, stopBtn)

  const status = document.createElement('div')
  status.className = 'mb-4 p-3 bg-gray-100 rounded text-sm'
  status.innerHTML = '<span class="font-semibold">状态：</span><span id="speakToTxt-status">就绪</span>'

  const resultContainer = document.createElement('div')
  resultContainer.className = 'p-4 bg-blue-50 rounded'
  const resultTitle = document.createElement('div')
  resultTitle.className = 'font-semibold text-gray-700 mb-2'
  resultTitle.textContent = '识别结果：'
  const resultText = document.createElement('div')
  resultText.id = 'speakToTxt-result'
  resultText.className = 'text-gray-800 min-h-[60px] whitespace-pre-wrap'
  resultText.textContent = '等待识别...'
  resultContainer.append(resultTitle, resultText)

  // 配置选项
  const configContainer = document.createElement('div')
  configContainer.className = 'mb-4 p-4 bg-gray-50 rounded'
  const configTitle = document.createElement('div')
  configTitle.className = 'font-semibold text-gray-700 mb-2'
  configTitle.textContent = '配置选项：'

  const continuousCheck = document.createElement('label')
  continuousCheck.className = 'flex items-center gap-2 mb-2 cursor-pointer'
  const continuousInput = document.createElement('input')
  continuousInput.type = 'checkbox'
  continuousInput.className = 'w-4 h-4'
  continuousCheck.append(continuousInput, document.createTextNode('连续识别（用户停止说话后继续识别）'))

  const interimCheck = document.createElement('label')
  interimCheck.className = 'flex items-center gap-2 cursor-pointer'
  const interimInput = document.createElement('input')
  interimInput.type = 'checkbox'
  interimInput.className = 'w-4 h-4'
  interimCheck.append(interimInput, document.createTextNode('返回临时结果'))

  configContainer.append(configTitle, continuousCheck, interimCheck)

  container.append(title, description, configContainer, controls, status, resultContainer)

  let speakToTxt: SpeakToTxt | null = null
  let isRecognizing = false

  const updateStatus = (text: string, color = 'text-gray-700') => {
    const statusEl = document.getElementById('speakToTxt-status')!
    statusEl.textContent = text
    statusEl.className = color
  }

  const updateResult = (text: string) => {
    const resultEl = document.getElementById('speakToTxt-result')!
    resultEl.textContent = text || '等待识别...'
  }

  // 检查浏览器支持
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    updateStatus('不支持语音识别，请使用 Chrome 或 Edge 浏览器', 'text-red-600')
    startBtn.disabled = true
    return container
  }

  // 开始识别
  startBtn.onclick = () => {
    if (isRecognizing) {
      return
    }

    try {
      speakToTxt = new SpeakToTxt({
        continuous: continuousInput.checked,
        interimResults: interimInput.checked,
        lang: 'zh-CN',
        onstart: () => {
          isRecognizing = true
          updateStatus('正在识别...', 'text-blue-600')
          startBtn.disabled = true
          stopBtn.disabled = false
        },
        onEnd: () => {
          isRecognizing = false
          updateStatus('识别结束', 'text-gray-600')
          startBtn.disabled = false
          stopBtn.disabled = true
        },
        onResult: (data, e) => {
          let result = ''
          for (let i = 0; i < e.results.length; i++) {
            const transcript = e.results[i][0].transcript
            const isFinal = e.results[i].isFinal
            result += `${isFinal ? '✓' : '…'} ${transcript}\n`
          }
          updateResult(result)
        },
      })

      speakToTxt.start()
    }
    catch (error: any) {
      updateStatus(`错误: ${error.message}`, 'text-red-600')
    }
  }

  // 停止识别
  stopBtn.onclick = () => {
    if (speakToTxt) {
      speakToTxt.stop()
      isRecognizing = false
      updateStatus('已停止', 'text-gray-600')
      startBtn.disabled = false
      stopBtn.disabled = true
    }
  }

  return container
}


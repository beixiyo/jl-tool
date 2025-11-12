import { Speaker } from '@/webApi'

/**
 * 文字转语音功能测试
 */
export function initSpeakerTest() {
  const container = document.createElement('div')
  container.className = 'bg-white rounded-lg shadow-lg p-6 mb-6'

  const title = document.createElement('h2')
  title.className = 'text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-green-500'
  title.textContent = '🔊 文字转语音测试'

  const description = document.createElement('p')
  description.className = 'text-gray-600 mb-4'
  description.textContent = '测试文字转语音播放功能，支持语速、音高、音量等参数调节'

  const textArea = document.createElement('textarea')
  textArea.className = 'w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
  textArea.rows = 4
  textArea.placeholder = '请输入要转换为语音的文字...'
  textArea.value = '你好，这是一个文字转语音的测试。今天天气真不错！'

  const controls = document.createElement('div')
  controls.className = 'flex flex-wrap gap-3 mb-4'

  // 参数控制
  const paramsContainer = document.createElement('div')
  paramsContainer.className = 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded'

  // 语速控制
  const rateContainer = document.createElement('div')
  const rateLabel = document.createElement('label')
  rateLabel.className = 'block text-sm font-medium text-gray-700 mb-1'
  rateLabel.textContent = '语速 (0.1-10)'
  const rateInput = document.createElement('input')
  rateInput.type = 'range'
  rateInput.min = '0.1'
  rateInput.max = '10'
  rateInput.step = '0.1'
  rateInput.value = '1'
  rateInput.className = 'w-full'
  const rateValue = document.createElement('span')
  rateValue.className = 'text-sm text-gray-600'
  rateValue.textContent = '1.0'
  rateInput.oninput = () => {
    rateValue.textContent = rateInput.value
  }
  rateContainer.append(rateLabel, rateInput, rateValue)

  // 音高控制
  const pitchContainer = document.createElement('div')
  const pitchLabel = document.createElement('label')
  pitchLabel.className = 'block text-sm font-medium text-gray-700 mb-1'
  pitchLabel.textContent = '音高 (0-2)'
  const pitchInput = document.createElement('input')
  pitchInput.type = 'range'
  pitchInput.min = '0'
  pitchInput.max = '2'
  pitchInput.step = '0.1'
  pitchInput.value = '1'
  pitchInput.className = 'w-full'
  const pitchValue = document.createElement('span')
  pitchValue.className = 'text-sm text-gray-600'
  pitchValue.textContent = '1.0'
  pitchInput.oninput = () => {
    pitchValue.textContent = pitchInput.value
  }
  pitchContainer.append(pitchLabel, pitchInput, pitchValue)

  // 音量控制
  const volumeContainer = document.createElement('div')
  const volumeLabel = document.createElement('label')
  volumeLabel.className = 'block text-sm font-medium text-gray-700 mb-1'
  volumeLabel.textContent = '音量 (0-1)'
  const volumeInput = document.createElement('input')
  volumeInput.type = 'range'
  volumeInput.min = '0'
  volumeInput.max = '1'
  volumeInput.step = '0.1'
  volumeInput.value = '1'
  volumeInput.className = 'w-full'
  const volumeValue = document.createElement('span')
  volumeValue.className = 'text-sm text-gray-600'
  volumeValue.textContent = '1.0'
  volumeInput.oninput = () => {
    volumeValue.textContent = volumeInput.value
  }
  volumeContainer.append(volumeLabel, volumeInput, volumeValue)

  paramsContainer.append(rateContainer, pitchContainer, volumeContainer)

  // 按钮
  const playBtn = document.createElement('button')
  playBtn.className = 'px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors'
  playBtn.textContent = '播放'

  const stopBtn = document.createElement('button')
  stopBtn.className = 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors'
  stopBtn.textContent = '停止'

  const pauseBtn = document.createElement('button')
  pauseBtn.className = 'px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors'
  pauseBtn.textContent = '暂停'

  const resumeBtn = document.createElement('button')
  resumeBtn.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
  resumeBtn.textContent = '继续'

  controls.append(playBtn, stopBtn, pauseBtn, resumeBtn)

  const status = document.createElement('div')
  status.className = 'p-3 bg-gray-100 rounded text-sm'
  status.innerHTML = '<span class="font-semibold">状态：</span><span id="speaker-status">就绪</span>'

  container.append(title, description, textArea, paramsContainer, controls, status)

  let speaker: Speaker | null = null

  const updateStatus = (text: string, color = 'text-gray-700') => {
    const statusEl = document.getElementById('speaker-status')!
    statusEl.textContent = text
    statusEl.className = color
  }

  // 创建 Speaker 实例
  const createSpeaker = () => {
    if (speaker) {
      speaker.stop()
    }
    speaker = new Speaker({
      txt: textArea.value || '请输入文字',
      rate: parseFloat(rateInput.value),
      pitch: parseFloat(pitchInput.value),
      volume: parseFloat(volumeInput.value),
    })
  }

  // 播放
  playBtn.onclick = () => {
    createSpeaker()
    speaker?.play((e) => {
      updateStatus('播放完成', 'text-green-600')
    })
    updateStatus('正在播放...', 'text-blue-600')
  }

  // 停止
  stopBtn.onclick = () => {
    speaker?.stop()
    updateStatus('已停止', 'text-gray-600')
  }

  // 暂停
  pauseBtn.onclick = () => {
    speaker?.pause()
    updateStatus('已暂停', 'text-yellow-600')
  }

  // 继续
  resumeBtn.onclick = () => {
    speaker?.resume()
    updateStatus('正在播放...', 'text-blue-600')
  }

  // 实时更新参数
  rateInput.onchange = () => {
    if (speaker) {
      speaker.setRate(parseFloat(rateInput.value))
    }
  }

  pitchInput.onchange = () => {
    if (speaker) {
      speaker.setPitch(parseFloat(pitchInput.value))
    }
  }

  volumeInput.onchange = () => {
    if (speaker) {
      speaker.setVolume(parseFloat(volumeInput.value))
    }
  }

  return container
}


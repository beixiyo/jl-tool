import { Recorder } from '@/webApi'

/**
 * 录音功能测试
 */
export function initRecorderTest() {
  const container = document.createElement('div')
  container.className = 'bg-white rounded-lg shadow-lg p-6 mb-6'

  const title = document.createElement('h2')
  title.className = 'text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500'
  title.textContent = '🎤 录音功能测试'

  const description = document.createElement('p')
  description.className = 'text-gray-600 mb-4'
  description.textContent = '测试录音、播放和音频分析功能'

  const controls = document.createElement('div')
  controls.className = 'flex flex-wrap gap-3 mb-4'

  const status = document.createElement('div')
  status.className = 'mb-4 p-3 bg-gray-100 rounded text-sm'
  status.innerHTML = '<span class="font-semibold">状态：</span><span id="recorder-status">未初始化</span>'

  const audioInfo = document.createElement('div')
  audioInfo.className = 'mb-4 p-3 bg-blue-50 rounded text-sm hidden'
  audioInfo.id = 'audio-info'

  // 创建按钮
  const initBtn = document.createElement('button')
  initBtn.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
  initBtn.textContent = '初始化'

  const startBtn = document.createElement('button')
  startBtn.className = 'px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
  startBtn.textContent = '开始录音'
  startBtn.disabled = true

  const stopBtn = document.createElement('button')
  stopBtn.className = 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
  stopBtn.textContent = '停止录音'
  stopBtn.disabled = true

  const playBtn = document.createElement('button')
  playBtn.className = 'px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
  playBtn.textContent = '播放录音'
  playBtn.disabled = true

  const destroyBtn = document.createElement('button')
  destroyBtn.className = 'px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
  destroyBtn.textContent = '销毁'
  destroyBtn.disabled = true

  // 音频可视化
  const canvas = document.createElement('canvas')
  canvas.className = 'w-full h-32 bg-gray-900 rounded mb-4 hidden'
  canvas.id = 'audio-visualizer'
  const ctx = canvas.getContext('2d')!

  controls.append(initBtn, startBtn, stopBtn, playBtn, destroyBtn)
  container.append(title, description, status, audioInfo, controls, canvas)

  let recorder: Recorder | null = null
  let animationFrameId: number | null = null

  const updateStatus = (text: string, color = 'text-gray-700') => {
    const statusEl = document.getElementById('recorder-status')!
    statusEl.textContent = text
    statusEl.className = color
  }

  const updateButtons = (state: 'idle' | 'initialized' | 'recording') => {
    switch (state) {
      case 'idle':
        initBtn.disabled = false
        startBtn.disabled = true
        stopBtn.disabled = true
        playBtn.disabled = true
        destroyBtn.disabled = true
        break
      case 'initialized':
        initBtn.disabled = true
        startBtn.disabled = false
        stopBtn.disabled = true
        playBtn.disabled = false
        destroyBtn.disabled = false
        break
      case 'recording':
        initBtn.disabled = true
        startBtn.disabled = true
        stopBtn.disabled = false
        playBtn.disabled = true
        destroyBtn.disabled = true
        break
    }
  }

  const drawVisualization = () => {
    if (!recorder || !recorder.analyser) {
      canvas.classList.add('hidden')
      return
    }

    canvas.classList.remove('hidden')
    const dataArray = recorder.getByteFrequencyData()
    if (!dataArray) return

    const width = canvas.width = canvas.offsetWidth
    const height = canvas.height = 128
    ctx.fillStyle = 'rgb(0, 0, 0)'
    ctx.fillRect(0, 0, width, height)

    const barWidth = (width / dataArray.length) * 2.5
    let x = 0

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * height

      const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height)
      gradient.addColorStop(0, `rgb(${255 - barHeight}, ${barHeight}, 100)`)
      gradient.addColorStop(1, `rgb(${255 - barHeight}, ${barHeight}, 200)`)

      ctx.fillStyle = gradient
      ctx.fillRect(x, height - barHeight, barWidth, barHeight)

      x += barWidth + 1
    }

    animationFrameId = requestAnimationFrame(drawVisualization)
  }

  // 初始化
  initBtn.onclick = async () => {
    try {
      updateStatus('正在初始化...', 'text-blue-600')
      recorder = new Recorder({
        createAnalyser: true,
        onFinish: (url, chunks) => {
          updateStatus('录音完成', 'text-green-600')
          updateButtons('initialized')
          const audioInfoEl = document.getElementById('audio-info')!
          audioInfoEl.classList.remove('hidden')
          audioInfoEl.innerHTML = `
            <span class="font-semibold">音频信息：</span><br>
            URL: ${url.substring(0, 50)}...<br>
            数据块数量: ${chunks.length}<br>
            MIME类型: ${recorder?.mimeType || 'unknown'}
          `
          playBtn.disabled = false
        },
        onError: (error) => {
          updateStatus(`错误: ${error.message}`, 'text-red-600')
        },
      })

      await recorder.init()
      updateStatus('已初始化，可以开始录音', 'text-green-600')
      updateButtons('initialized')
      drawVisualization()
    }
    catch (error: any) {
      updateStatus(`初始化失败: ${error.message}`, 'text-red-600')
    }
  }

  // 开始录音
  startBtn.onclick = () => {
    if (recorder) {
      recorder.start()
      updateStatus('正在录音...', 'text-red-600')
      updateButtons('recording')
    }
  }

  // 停止录音
  stopBtn.onclick = () => {
    if (recorder) {
      recorder.stop()
      updateStatus('正在处理录音...', 'text-yellow-600')
    }
  }

  // 播放录音
  playBtn.onclick = () => {
    if (recorder && recorder.audioUrl) {
      recorder.play()
      updateStatus('正在播放录音', 'text-purple-600')
    }
  }

  // 销毁
  destroyBtn.onclick = () => {
    if (recorder) {
      recorder.destroy()
      recorder = null
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
      updateStatus('已销毁', 'text-gray-600')
      updateButtons('idle')
      canvas.classList.add('hidden')
      audioInfo.classList.add('hidden')
    }
  }

  return container
}


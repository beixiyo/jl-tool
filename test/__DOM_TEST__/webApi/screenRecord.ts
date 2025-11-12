import { ScreenRecorder } from '@/webApi'

/**
 * 屏幕录制功能测试
 */
export function initScreenRecordTest() {
  const container = document.createElement('div')
  container.className = 'bg-white rounded-lg shadow-lg p-6 mb-6'

  const title = document.createElement('h2')
  title.className = 'text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-purple-500'
  title.textContent = '📹 屏幕录制功能测试'

  const description = document.createElement('p')
  description.className = 'text-gray-600 mb-4'
  description.textContent = '测试屏幕录制、实时预览和播放功能'

  // 视频预览容器
  const videoContainer = document.createElement('div')
  videoContainer.className = 'mb-4'

  const video = document.createElement('video')
  video.className = 'w-full max-w-2xl mx-auto rounded-lg shadow-md bg-black'
  video.controls = true
  video.playsInline = true
  video.muted = true

  videoContainer.append(video)

  const controls = document.createElement('div')
  controls.className = 'flex flex-wrap gap-3 mb-4'

  const status = document.createElement('div')
  status.className = 'mb-4 p-3 bg-gray-100 rounded text-sm'
  status.innerHTML = '<span class="font-semibold">状态：</span><span id="screen-record-status">未初始化</span>'

  const recordInfo = document.createElement('div')
  recordInfo.className = 'mb-4 p-3 bg-purple-50 rounded text-sm hidden'
  recordInfo.id = 'record-info'

  // 创建按钮
  const startBtn = document.createElement('button')
  startBtn.className = 'px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
  startBtn.textContent = '开始录制'
  startBtn.disabled = !ScreenRecorder.isSupported()

  const pauseBtn = document.createElement('button')
  pauseBtn.className = 'px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
  pauseBtn.textContent = '暂停'
  pauseBtn.disabled = true

  const resumeBtn = document.createElement('button')
  resumeBtn.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
  resumeBtn.textContent = '恢复'
  resumeBtn.disabled = true

  const stopBtn = document.createElement('button')
  stopBtn.className = 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
  stopBtn.textContent = '停止录制'
  stopBtn.disabled = true

  const destroyBtn = document.createElement('button')
  destroyBtn.className = 'px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
  destroyBtn.textContent = '销毁'
  destroyBtn.disabled = true

  controls.append(startBtn, pauseBtn, resumeBtn, stopBtn, destroyBtn)
  container.append(title, description, status, recordInfo, videoContainer, controls)

  let recorder: ScreenRecorder | null = null
  let recordedBlobUrl: string | null = null

  const updateStatus = (text: string, color = 'text-gray-700') => {
    const statusEl = document.getElementById('screen-record-status')!
    statusEl.textContent = text
    statusEl.className = color
  }

  const updateButtons = (state: 'idle' | 'recording' | 'paused' | 'stopped') => {
    switch (state) {
      case 'idle':
        startBtn.disabled = false
        pauseBtn.disabled = true
        resumeBtn.disabled = true
        stopBtn.disabled = true
        destroyBtn.disabled = false
        break
      case 'recording':
        startBtn.disabled = true
        pauseBtn.disabled = false
        resumeBtn.disabled = true
        stopBtn.disabled = false
        destroyBtn.disabled = true
        break
      case 'paused':
        startBtn.disabled = true
        pauseBtn.disabled = true
        resumeBtn.disabled = false
        stopBtn.disabled = false
        destroyBtn.disabled = true
        break
      case 'stopped':
        startBtn.disabled = false
        pauseBtn.disabled = true
        resumeBtn.disabled = true
        stopBtn.disabled = true
        destroyBtn.disabled = false
        break
    }
  }

  // 开始录制
  startBtn.onclick = async () => {
    try {
      updateStatus('正在请求屏幕录制权限...', 'text-blue-600')
      startBtn.disabled = true

      recorder = new ScreenRecorder({
        video: true,
        systemAudio: false,
        micAudio: false,
        onStart: () => {
          updateStatus('正在录制...', 'text-red-600')
          updateButtons('recording')

          // 录屏时给 video 元素设置 srcObject 以便实时查看
          const stream = recorder?.getMediaStream()
          if (stream) {
            video.srcObject = stream
            video.play().catch(() => {
              // 忽略自动播放失败
            })
          }
        },
        onPause: () => {
          updateStatus('已暂停', 'text-yellow-600')
          updateButtons('paused')
        },
        onResume: () => {
          updateStatus('正在录制...', 'text-red-600')
          updateButtons('recording')
        },
        onStop: (blob) => {
          updateStatus('录制完成', 'text-green-600')
          updateButtons('stopped')

          // 结束后传入 src 以便播放
          if (blob) {
            // 清理之前的 URL
            if (recordedBlobUrl) {
              URL.revokeObjectURL(recordedBlobUrl)
            }

            // 创建新的 Blob URL 并设置到 video 的 src
            recordedBlobUrl = URL.createObjectURL(blob)
            video.srcObject = null
            video.src = recordedBlobUrl
            video.muted = false

            // 显示录制信息
            const recordInfoEl = document.getElementById('record-info')!
            recordInfoEl.classList.remove('hidden')
            recordInfoEl.innerHTML = `
              <span class="font-semibold">录制信息：</span><br>
              文件大小: ${(blob.size / 1024 / 1024).toFixed(2)} MB<br>
              MIME类型: ${recorder?.mimeType || 'unknown'}<br>
              时长: ${video.duration ? `${video.duration.toFixed(2)} 秒` : '计算中...'}
            `

            // 等待视频元数据加载完成后显示时长
            video.onloadedmetadata = () => {
              const recordInfoEl = document.getElementById('record-info')!
              recordInfoEl.innerHTML = `
                <span class="font-semibold">录制信息：</span><br>
                文件大小: ${(blob.size / 1024 / 1024).toFixed(2)} MB<br>
                MIME类型: ${recorder?.mimeType || 'unknown'}<br>
                时长: ${video.duration.toFixed(2)} 秒
              `
            }
          }
          else {
            updateStatus('录制失败：未生成文件', 'text-red-600')
          }
        },
        onStateChange: (state) => {
          // 状态变化时的额外处理
          if (state === 'error') {
            updateStatus('录制出错', 'text-red-600')
            updateButtons('idle')
          }
        },
        onError: (error) => {
          updateStatus(`错误: ${error instanceof Error ? error.message : String(error)}`, 'text-red-600')
          updateButtons('idle')
        },
      })

      await recorder.start()
    }
    catch (error: any) {
      updateStatus(`启动失败: ${error.message}`, 'text-red-600')
      updateButtons('idle')
      recorder = null
    }
  }

  // 暂停录制
  pauseBtn.onclick = () => {
    if (recorder) {
      recorder.pause()
    }
  }

  // 恢复录制
  resumeBtn.onclick = () => {
    if (recorder) {
      recorder.resume()
    }
  }

  // 停止录制
  stopBtn.onclick = async () => {
    if (recorder) {
      updateStatus('正在停止录制...', 'text-yellow-600')
      try {
        await recorder.stop()
      }
      catch (error: any) {
        updateStatus(`停止失败: ${error.message}`, 'text-red-600')
      }
    }
  }

  // 销毁
  destroyBtn.onclick = () => {
    if (recorder) {
      recorder.dispose()
      recorder = null

      // 清理视频资源
      video.srcObject = null
      if (recordedBlobUrl) {
        URL.revokeObjectURL(recordedBlobUrl)
        recordedBlobUrl = null
      }
      video.src = ''
      video.muted = true

      updateStatus('已销毁', 'text-gray-600')
      updateButtons('idle')
      recordInfo.classList.add('hidden')
    }
  }

  // 检查是否支持
  if (!ScreenRecorder.isSupported()) {
    updateStatus('当前环境不支持屏幕录制', 'text-red-600')
    startBtn.disabled = true
  }

  return container
}


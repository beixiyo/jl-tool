import { openCamera } from '@/webApi'

/**
 * 摄像头功能测试
 */
export function initCameraTest() {
  const container = document.createElement('div')
  container.className = 'bg-white rounded-lg shadow-lg p-6 mb-6'

  const title = document.createElement('h2')
  title.className = 'text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-orange-500'
  title.textContent = '📷 摄像头功能测试'

  const description = document.createElement('p')
  description.className = 'text-gray-600 mb-4'
  description.textContent = '测试摄像头开启和关闭功能'

  const videoContainer = document.createElement('div')
  videoContainer.className = 'mb-4'

  const video = document.createElement('video')
  video.className = 'w-full max-w-md mx-auto rounded-lg shadow-md bg-black'
  video.autoplay = true
  video.playsInline = true
  video.muted = true

  videoContainer.append(video)

  const controls = document.createElement('div')
  controls.className = 'flex flex-wrap gap-3 mb-4'

  const openBtn = document.createElement('button')
  openBtn.className = 'px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors'
  openBtn.textContent = '开启摄像头'

  const closeBtn = document.createElement('button')
  closeBtn.className = 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
  closeBtn.textContent = '关闭摄像头'
  closeBtn.disabled = true

  controls.append(openBtn, closeBtn)

  const status = document.createElement('div')
  status.className = 'p-3 bg-gray-100 rounded text-sm'
  status.innerHTML = '<span class="font-semibold">状态：</span><span id="camera-status">未开启</span>'

  container.append(title, description, videoContainer, controls, status)

  let stopCamera: (() => void) | null = null

  const updateStatus = (text: string, color = 'text-gray-700') => {
    const statusEl = document.getElementById('camera-status')!
    statusEl.textContent = text
    statusEl.className = color
  }

  // 开启摄像头
  openBtn.onclick = async () => {
    try {
      updateStatus('正在请求摄像头权限...', 'text-blue-600')
      openBtn.disabled = true

      stopCamera = await openCamera(video)

      updateStatus('摄像头已开启', 'text-green-600')
      openBtn.disabled = true
      closeBtn.disabled = false
    }
    catch (error: any) {
      updateStatus(`错误: ${error.message}`, 'text-red-600')
      openBtn.disabled = false
    }
  }

  // 关闭摄像头
  closeBtn.onclick = () => {
    if (stopCamera) {
      stopCamera()
      stopCamera = null
      video.srcObject = null
      updateStatus('摄像头已关闭', 'text-gray-600')
      openBtn.disabled = false
      closeBtn.disabled = true
    }
  }

  return container
}


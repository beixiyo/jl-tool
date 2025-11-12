import { initRecorderTest } from './recorder'
import { initSpeakerTest } from './speaker'
import { initSpeakToTxtTest } from './speakToTxt'
import { initCameraTest } from './camera'
import { initScreenRecordTest } from './screenRecord'

/**
 * WebAPI 功能测试总结页面
 * 组合所有 webApi 功能的测试
 */
export function initWebApiTests() {
  // 创建主容器
  const mainContainer = document.createElement('div')
  mainContainer.className = 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6'

  // 创建标题区域
  const header = document.createElement('div')
  header.className = 'text-center mb-8'

  const title = document.createElement('h1')
  title.className = 'text-4xl font-bold text-gray-800 mb-2'
  title.textContent = '🎯 WebAPI 功能测试'

  const subtitle = document.createElement('p')
  subtitle.className = 'text-gray-600 text-lg'
  subtitle.textContent = '测试录音、语音、摄像头、录屏等 Web API 功能'

  header.append(title, subtitle)

  // 创建内容容器
  const contentContainer = document.createElement('div')
  contentContainer.className = 'max-w-6xl mx-auto'

  // 添加各个测试模块
  contentContainer.append(
    initRecorderTest(),
    initSpeakerTest(),
    initSpeakToTxtTest(),
    initCameraTest(),
    initScreenRecordTest(),
  )

  mainContainer.append(header, contentContainer)

  // 添加到页面
  document.body.append(mainContainer)
}


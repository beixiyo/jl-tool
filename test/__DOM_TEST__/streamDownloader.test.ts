/* eslint-disable no-alert */
import { createStreamDownloader } from '@/fileTool/streamDownloader'
import { wait } from '@/tools/tools'

const button = document.createElement('button')
button.textContent = 'Start Stream Download Example'
document.body.appendChild(button)

button.onclick = () => {
  exampleUsage()
}

async function exampleUsage() {
  const fileName = 'myStreamedFile.txt'
  const mimeType = 'text/plain'

  try {
    const downloader = await createStreamDownloader(fileName, mimeType)

    /** 模拟接收数据块 */
    const dataPart1 = new TextEncoder().encode('Hello, ')
    await downloader.append(dataPart1)
    console.log('Appended part 1')

    await wait(100)

    const dataPart2 = new TextEncoder().encode('streaming ')
    await downloader.append(dataPart2)
    console.log('Appended part 2')

    const dataPart3 = new TextEncoder().encode('world!')
    await downloader.append(dataPart3)
    console.log('Appended part 3')

    /** 所有数据块发送完毕 */
    await downloader.complete()
    console.log('Download process finished.')
    alert(`Download completed! Check your downloads folder for ${fileName}`)
  }
  catch (error) {
    /** 这个 catch 主要捕获 initializeStreamDownloader 中用户取消文件选择的情况 */
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('Download setup was cancelled by the user.')
    }
    else {
      console.error('An error occurred during the download process:', error)
    }
  }
}

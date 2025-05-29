import type { StreamDownloader } from '@/fileTool/streamDownloader'
import { createStreamDownloader } from '@/fileTool/streamDownloader'
import { wait } from '@/tools/tools'

const swButton = document.createElement('button')
swButton.textContent = 'Start Service Worker Stream Download Example'
swButton.onclick = exampleUseServiceWorker

const fileButton = document.createElement('button')
fileButton.textContent = 'Start File Stream Download Example'
fileButton.onclick = exampleUseFileDownload

document.body.append(swButton, fileButton)
const fileName = 'myStreamedFile.txt'

async function exampleUseServiceWorker() {
  const swPath = new URL('/streamDownload.js', import.meta.url).href
  const swDownloader = await createStreamDownloader(fileName, {
    swPath,
  })

  for (let i = 0; i < 1000; i++) {
    await write(swDownloader, `Line ${i}\n`)
  }
  await swDownloader.complete()
}

async function write(downloader: StreamDownloader, str: string) {
  const data = new Blob([str])
  const buffer = await data.arrayBuffer()
  await downloader.append(new Uint8Array(buffer))
}

async function exampleUseFileDownload() {
  const fileDownloader = await createStreamDownloader(fileName)

  for (let i = 0; i < 100; i++) {
    await write(fileDownloader, `Line ${i}\n`)
    await wait(50)
  }
  await fileDownloader.complete()
}

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createStreamDownloader } from '@/fileTool/streamDownloader'

describe('createStreamDownloader Service Worker mode', () => {
  afterEach(() => {
    document.body.replaceChildren()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('uses the injected registration and waits for chunk backpressure acknowledgement', async () => {
    let acceptChunk: (() => void) | undefined
    const worker = createWorker((port, request) => {
      if (request.type === 'chunk') {
        acceptChunk = () => port.postMessage({
          type: 'chunk-accepted',
          sequence: request.sequence,
        })
      }
      else if (request.type === 'end') {
        port.postMessage({ type: 'complete' })
      }
    })
    const unrelatedController = { postMessage: vi.fn() }
    stubServiceWorker({ controller: unrelatedController })
    vi.stubGlobal('MessageChannel', FakeMessageChannel)

    const downloader = await createStreamDownloader('report.txt', {
      mimeType: 'text/plain',
      serviceWorker: {
        registration: { active: worker } as unknown as ServiceWorkerRegistration,
      },
    })
    let appended = false
    const appending = downloader.append(new TextEncoder().encode('hello'))
      .then(() => { appended = true })

    await vi.waitFor(() => expect(acceptChunk).toBeTypeOf('function'))
    expect(appended).toBe(false)
    acceptChunk?.()
    await appending
    await downloader.complete()

    expect(unrelatedController.postMessage).not.toHaveBeenCalled()
    expect(document.querySelector('iframe')?.src).toContain('/stream-download/report.txt')
  })

  it('registers an emitted asset without expanding its scope to the application root', async () => {
    const worker = createWorker((port, request) => {
      if (request.type === 'end') port.postMessage({ type: 'complete' })
    })
    const register = vi.fn(async () => ({ active: worker }))
    stubServiceWorker({ register })
    vi.stubGlobal('MessageChannel', FakeMessageChannel)

    const downloader = await createStreamDownloader('report.txt', {
      serviceWorker: { scriptUrl: '/assets/streamDownload-D4F3.js' },
    })
    await downloader.complete()

    expect(register).toHaveBeenCalledWith('/assets/streamDownload-D4F3.js', undefined)
  })

  it('registers the package worker without requiring the caller to provide its URL', async () => {
    const worker = createWorker((port, request) => {
      if (request.type === 'end') port.postMessage({ type: 'complete' })
    })
    const register = vi.fn(async () => ({ active: worker }))
    stubServiceWorker({ register })
    vi.stubGlobal('MessageChannel', FakeMessageChannel)

    const downloader = await createStreamDownloader('report.txt')
    await downloader.complete()

    expect(register).toHaveBeenCalledOnce()
    expect(register).toHaveBeenCalledWith(
      expect.stringMatching(/\/sw\/streamDownload\.js\?no-inline$/),
      undefined,
    )
  })

  it('skips Service Worker registration when it is explicitly disabled', async () => {
    const write = vi.fn()
    const close = vi.fn()
    const register = vi.fn()
    const showSaveFilePicker = vi.fn(async () => ({
      createWritable: async () => ({ write, close, abort: vi.fn() }),
    }))
    stubServiceWorker({ register })
    vi.stubGlobal('showSaveFilePicker', showSaveFilePicker)

    const downloader = await createStreamDownloader('report.txt', {
      mimeType: 'text/plain',
      serviceWorker: false,
    })
    const chunk = new TextEncoder().encode('hello')
    await downloader.append(chunk)
    await downloader.complete()

    expect(register).not.toHaveBeenCalled()
    expect(showSaveFilePicker).toHaveBeenCalledWith({
      suggestedName: 'report.txt',
      types: [{
        description: 'File',
        accept: { 'text/plain': ['.txt'] },
      }],
    })
    expect(write).toHaveBeenCalledWith(chunk)
    expect(close).toHaveBeenCalledOnce()
  })

  it('does not expose the downloader before the browser starts fetching its download URL', async () => {
    let startDownload: (() => void) | undefined
    const worker = {
      state: 'activated',
      postMessage: vi.fn((_data: unknown, transfer: Transferable[]) => {
        const port = transfer[0] as unknown as FakePort
        port.onmessage = ({ data }) => {
          const request = data as ServiceWorkerRequest
          if (request.type === 'end') port.postMessage({ type: 'complete' })
        }
        port.postMessage({
          type: 'ready',
          downloadUrl: `${location.origin}/stream-download/report.txt`,
        })
        startDownload = () => port.postMessage({ type: 'download-started' })
      }),
    } as unknown as ServiceWorker
    stubServiceWorker({})
    vi.stubGlobal('MessageChannel', FakeMessageChannel)

    let created = false
    const creating = createStreamDownloader('report.txt', {
      serviceWorker: {
        registration: { active: worker } as unknown as ServiceWorkerRegistration,
      },
    }).then((downloader) => {
      created = true
      return downloader
    })

    await vi.waitFor(() => expect(startDownload).toBeTypeOf('function'))
    expect(created).toBe(false)
    startDownload?.()
    const downloader = await creating
    await downloader.complete()
  })

  it('waits for an updating worker instead of messaging the stale active version', async () => {
    const listeners = new Set<EventListenerOrEventListenerObject>()
    const installing = createWorker((port, request) => {
      if (request.type === 'end') port.postMessage({ type: 'complete' })
    }) as unknown as MutableServiceWorker
    installing.state = 'installing'
    installing.addEventListener = (_type, listener) => { listeners.add(listener) }
    installing.removeEventListener = (_type, listener) => { listeners.delete(listener) }
    const staleActive = { state: 'activated', postMessage: vi.fn() }
    stubServiceWorker({})
    vi.stubGlobal('MessageChannel', FakeMessageChannel)

    const creating = createStreamDownloader('report.txt', {
      serviceWorker: {
        registration: {
          active: staleActive,
          installing,
        } as unknown as ServiceWorkerRegistration,
      },
    })
    installing.state = 'activated'
    listeners.forEach((listener) => {
      const event = new Event('statechange')
      if (typeof listener === 'function') listener(event)
      else listener.handleEvent(event)
    })
    const downloader = await creating
    await downloader.complete()

    expect(staleActive.postMessage).not.toHaveBeenCalled()
    expect(installing.postMessage).toHaveBeenCalledOnce()
  })
})

function createWorker(
  onRequest: (port: FakePort, request: ServiceWorkerRequest) => void,
) {
  return {
    state: 'activated',
    postMessage: vi.fn((_data: unknown, transfer: Transferable[]) => {
      const port = transfer[0] as unknown as FakePort
      port.onmessage = ({ data }) => onRequest(port, data as ServiceWorkerRequest)
      port.postMessage({
        type: 'ready',
        downloadUrl: `${location.origin}/stream-download/report.txt`,
      })
      port.postMessage({ type: 'download-started' })
    }),
  } as unknown as ServiceWorker
}

function stubServiceWorker(value: object) {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value,
  })
}

class FakeMessageChannel {
  port1 = new FakePort()
  port2 = new FakePort()

  constructor() {
    this.port1.peer = this.port2
    this.port2.peer = this.port1
  }
}

class FakePort {
  peer?: FakePort
  onmessage: ((event: MessageEvent) => void) | null = null
  onmessageerror: (() => void) | null = null

  postMessage(data: unknown) {
    const target = this.peer
    queueMicrotask(() => target?.onmessage?.({ data } as MessageEvent))
  }

  start() {}
  close() {}
}

type ServiceWorkerRequest =
  | { type: 'chunk', sequence: number, chunk: ArrayBuffer }
  | { type: 'end' }
  | { type: 'abort' }

type MutableServiceWorker = {
  state: ServiceWorkerState
  postMessage: ReturnType<typeof vi.fn>
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void
  removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void
}

import { Button, PageShell, Panel, StatusBadge } from '@app/components'
import { createSignal, onCleanup, onMount } from 'solid-js'
import { compressImg, cutImg } from '@/canvas/imgHandle'
import { fillPixel, getPixel, parseImgData } from '@/canvas/tools'
import { getImg } from '@/domTools'
import { blobToBase64 } from '@/fileTool/tools'

const DEMO_WIDTH = 4
const DEMO_HEIGHT = 4

/** Canvas 工具的真实 DOM 交互页面 */
export function CanvasPage() {
  let pixelCanvas!: HTMLCanvasElement
  let sourceImage!: HTMLImageElement
  let resultImage!: HTMLImageElement
  let cropImage!: HTMLImageElement
  let fileInput!: HTMLInputElement
  let sourceObjectUrl: string | undefined
  let resultObjectUrl: string | undefined
  let cropObjectUrl: string | undefined

  const [status, setStatus] = createSignal('等待选择图片')
  const [pixelSummary, setPixelSummary] = createSignal('尚未运行像素工具')
  const [resultSize, setResultSize] = createSignal('—')

  onMount(() => {
    const context = pixelCanvas.getContext('2d')
    if (!context)
      return

    pixelCanvas.width = DEMO_WIDTH
    pixelCanvas.height = DEMO_HEIGHT
    fillPixel(context, 0, 0, 'rgba(255, 0, 0, 0.5)')
    fillPixel(context, DEMO_WIDTH - 1, DEMO_HEIGHT - 1, 'rgba(40, 255, 255, 0.5)')
    const imageData = context.getImageData(0, 0, DEMO_WIDTH, DEMO_HEIGHT)
    const topLeft = getPixel(0, 0, imageData)
    const bottomRight = getPixel(DEMO_WIDTH - 1, DEMO_HEIGHT - 1, imageData)
    const rows = parseImgData(imageData).length
    setPixelSummary(`左上 ${topLeft.join(', ')} · 右下 ${bottomRight.join(', ')} · ${rows} 行像素`)
  })

  onCleanup(() => {
    if (sourceObjectUrl)
      URL.revokeObjectURL(sourceObjectUrl)
    if (resultObjectUrl)
      URL.revokeObjectURL(resultObjectUrl)
    if (cropObjectUrl)
      URL.revokeObjectURL(cropObjectUrl)
  })

  async function loadImage(file: File) {
    if (sourceObjectUrl)
      URL.revokeObjectURL(sourceObjectUrl)
    sourceObjectUrl = URL.createObjectURL(file)
    sourceImage.src = sourceObjectUrl
    await sourceImage.decode()
    setStatus(`${file.name} · ${sourceImage.naturalWidth} × ${sourceImage.naturalHeight}`)
  }

  async function compressSelectedImage() {
    if (!fileInput.files?.[0]) {
      setStatus('请先选择一张图片')
      return
    }

    try {
      const file = fileInput.files[0]
      const base64 = await blobToBase64(file)
      const image = await getImg(base64) as HTMLImageElement
      const compressed = await compressImg(image, 'blob', 0.5, 'image/webp')
      if (resultObjectUrl)
        URL.revokeObjectURL(resultObjectUrl)
      resultObjectUrl = URL.createObjectURL(compressed)
      resultImage.src = resultObjectUrl
      setResultSize(`${Math.round(compressed.size / 1024)} KB WebP`)
      setStatus('压缩完成')
    }
    catch (error) {
      setStatus(error instanceof Error
        ? error.message
        : '图片压缩失败')
    }
  }

  async function cropSelectedImage() {
    if (!sourceImage.src || !sourceImage.complete) {
      setStatus('请先选择一张图片')
      return
    }

    try {
      const cropped = await cutImg(sourceImage, {
        x: 0,
        y: 0,
        width: Math.min(200, sourceImage.naturalWidth),
        height: Math.min(100, sourceImage.naturalHeight),
        scaleX: 1.2,
        scaleY: 1.2,
      }, 'blob')
      if (cropObjectUrl)
        URL.revokeObjectURL(cropObjectUrl)
      cropObjectUrl = URL.createObjectURL(cropped)
      cropImage.src = cropObjectUrl
      setStatus('裁剪完成')
    }
    catch (error) {
      setStatus(error instanceof Error
        ? error.message
        : '图片裁剪失败')
    }
  }

  return (
    <PageShell title="Canvas 工具" description="使用真实 canvas、图片元素和 jl-tool 图像 API 验证像素处理、压缩与裁剪">
      <div class="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="像素工具" description="页面中的 canvas 由 JSX 创建，工具函数只接收真实 2D 上下文">
          <div class="flex items-center gap-3">
            <canvas ref={pixelCanvas} width="4" height="4" class="h-32 w-32 rounded-xl border border-slate-700 bg-slate-950 [image-rendering:pixelated]" />
            <div class="space-y-2 text-sm text-slate-300">
              <StatusBadge tone="success">已初始化</StatusBadge>
              <p>{pixelSummary()}</p>
            </div>
          </div>
        </Panel>

        <Panel title="图片处理" description="选择本地图片后，分别运行 compressImg 和 cutImg">
          <div class="flex flex-wrap items-center gap-3">
            <input ref={fileInput} type="file" accept="image/*" class="block max-w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-400 file:px-3 file:py-2 file:font-semibold file:text-slate-950" onChange={() => fileInput.files?.[0] && loadImage(fileInput.files[0])} />
            <Button onClick={compressSelectedImage}>压缩 WebP</Button>
            <Button onClick={cropSelectedImage}>裁剪图片</Button>
          </div>
          <p class="mt-4 text-sm text-emerald-300">{status()}</p>
          <div class="mt-5 grid gap-4 sm:grid-cols-3">
            <ImageResult label="原图" imageRef={element => sourceImage = element} />
            <ImageResult label={`压缩结果 · ${resultSize()}`} imageRef={element => resultImage = element} />
            <ImageResult label="裁剪结果" imageRef={element => cropImage = element} />
          </div>
        </Panel>
      </div>
    </PageShell>
  )
}

function ImageResult(props: { label: string, imageRef: (element: HTMLImageElement) => void }) {
  return (
    <figure class="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <figcaption class="border-b border-slate-800 px-3 py-2 text-xs text-slate-400">{props.label}</figcaption>
      <img ref={props.imageRef} alt={props.label} class="aspect-video h-auto min-h-24 w-full object-contain" />
    </figure>
  )
}

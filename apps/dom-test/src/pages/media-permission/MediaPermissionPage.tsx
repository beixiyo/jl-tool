import type { MediaAccessFailure, MediaPermissionName, MediaPermissionState } from '@/webApi/MediaPermission'
import { classifyMediaAccessError, hasMediaInputDevice, queryMediaPermission, watchMediaPermission } from '@/webApi/MediaPermission'
import { MicrophoneInput } from '@/webApi/MicrophoneInput'
import { Button, createEventLog, EventLog, Metric, PageShell, Panel, SelectField, StatusBadge, Toggle } from '@app/components'
import { createSignal, onCleanup, onMount } from 'solid-js'

/** 可模拟的 getUserMedia 错误样本：各浏览器真实报出的 name + message */
const ERROR_SAMPLES = [
  { value: 'user-denied', label: 'NotAllowedError: Permission denied', name: 'NotAllowedError', message: 'Permission denied' },
  { value: 'system-denied', label: 'NotAllowedError: Permission denied by system', name: 'NotAllowedError', message: 'Permission denied by system' },
  { value: 'not-found', label: 'NotFoundError: Requested device not found', name: 'NotFoundError', message: 'Requested device not found' },
  { value: 'not-readable', label: 'NotReadableError: Could not start audio source', name: 'NotReadableError', message: 'Could not start audio source' },
  { value: 'abort', label: 'AbortError: Starting audio failed', name: 'AbortError', message: 'Starting audio failed' },
  { value: 'overconstrained', label: 'OverconstrainedError', name: 'OverconstrainedError', message: 'Constraints could not be satisfied' },
  { value: 'security', label: 'SecurityError: Insecure context', name: 'SecurityError', message: 'Insecure context' },
  { value: 'type', label: 'TypeError: constraints invalid', name: 'TypeError', message: 'At least one of audio and video must be requested' },
] as const

const STATE_OPTIONS = [
  { value: 'granted' },
  { value: 'prompt' },
  { value: 'denied' },
  { value: 'unknown' },
] as const satisfies readonly { value: MediaPermissionState }[]

/** 使用真实 Permissions API、enumerateDevices 和 getUserMedia 验证媒体权限工具 */
export function MediaPermissionPage() {
  const [micState, setMicState] = createSignal<MediaPermissionState>('unknown')
  const [cameraState, setCameraState] = createSignal<MediaPermissionState>('unknown')
  const [hasMic, setHasMic] = createSignal<boolean | null>(null)
  const [hasCamera, setHasCamera] = createSignal<boolean | null>(null)
  const [acquireResult, setAcquireResult] = createSignal('尚未申请')
  const [acquireTone, setAcquireTone] = createSignal<'neutral' | 'success' | 'danger'>('neutral')
  const [acquireFailure, setAcquireFailure] = createSignal<MediaAccessFailure | null>(null)
  const [acquiring, setAcquiring] = createSignal(false)
  const log = createEventLog()

  const [sample, setSample] = createSignal<SampleValue>('user-denied')
  const [stateBefore, setStateBefore] = createSignal<MediaPermissionState>('prompt')
  const [stateAfter, setStateAfter] = createSignal<MediaPermissionState>('denied')
  const [hasInputDevice, setHasInputDevice] = createSignal(true)
  const [simulated, setSimulated] = createSignal<MediaAccessFailure | null>(null)

  const setters: Record<MediaPermissionName, (state: MediaPermissionState) => void> = {
    microphone: setMicState,
    camera: setCameraState,
  }

  const refresh = async () => {
    const [mic, camera, micDevice, cameraDevice] = await Promise.all([
      queryMediaPermission('microphone'),
      queryMediaPermission('camera'),
      hasMediaInputDevice('audioinput'),
      hasMediaInputDevice('videoinput'),
    ])
    setMicState(mic)
    setCameraState(camera)
    setHasMic(micDevice)
    setHasCamera(cameraDevice)
  }

  /** 走 MicrophoneInput.acquire 拿到归类后的失败原因，成功后立即释放，不占用麦克风 */
  const requestMicrophone = async () => {
    setAcquiring(true)
    const input = new MicrophoneInput()
    try {
      const result = await input.acquire()
      if (result.ok) {
        const label = result.stream.getAudioTracks()[0]?.label ?? ''
        setAcquireTone('success')
        setAcquireFailure(null)
        setAcquireResult(`成功：${label || '（无 label）'}，已立即释放`)
        log.push(`acquire ok · ${label}`, 'success')
      }
      else {
        const errorText = describeError(result.error)
        setAcquireTone('danger')
        setAcquireFailure(result.failure)
        setAcquireResult(`失败：${result.failure} · permissionState=${result.permissionState} · ${errorText}`)
        log.push(`acquire failed · ${result.failure} · ${errorText}`, 'danger')
      }
    }
    finally {
      input.release()
      setAcquiring(false)
      void refresh()
    }
  }

  const simulate = () => {
    const picked = ERROR_SAMPLES.find((item) => item.value === sample())!
    const error = new DOMException(picked.message, picked.name)
    setSimulated(classifyMediaAccessError(error, {
      stateBefore: stateBefore(),
      stateAfter: stateAfter(),
      hasInputDevice: hasInputDevice(),
    }))
  }

  onMount(() => {
    void refresh()

    const disposers = (['microphone', 'camera'] as const).map((name) =>
      watchMediaPermission(name, (state) => {
        setters[name](state)
        log.push(
          `${name} 权限变为 ${state}`,
          state === 'denied'
            ? 'danger'
            : 'warning',
        )
      })
    )

    const handleDeviceChange = () => {
      log.push('devicechange')
      void refresh()
    }
    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange)

    onCleanup(() => {
      disposers.forEach((dispose) => dispose())
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange)
    })
  })

  /** 站点级被拒会意提示怎么改回；system-denied 是操作系统层禁止了浏览器 */
  const deniedNames = () =>
    [
      micState() === 'denied'
        ? '麦克风'
        : '',
      cameraState() === 'denied'
        ? '摄像头'
        : '',
    ].filter(Boolean)
  const showPermissionHint = () => deniedNames().length > 0 || acquireFailure() === 'system-denied'

  return (
    <PageShell
      title="MediaPermission"
      description="读取与订阅站点媒体权限、检测输入设备，并验证 getUserMedia 失败归类。在地址栏站点设置里修改权限，可以看到状态实时变化。"
    >
      <Panel title="当前状态" description="watchMediaPermission 实时订阅；devicechange 时重新检测设备。Permissions API 不支持时显示 unknown。">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="麦克风权限" value={ micState() } />
          <Metric label="摄像头权限" value={ cameraState() } />
          <Metric label="有 audioinput 设备" value={ formatBool(hasMic()) } />
          <Metric label="有 videoinput 设备" value={ formatBool(hasCamera()) } />
        </div>
        <div class="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={ () => void requestMicrophone() } disabled={ acquiring() }>申请麦克风</Button>
          <Button onClick={ () => void refresh() }>重新读取</Button>
          <StatusBadge tone={ acquireTone() }>{ acquireResult() }</StatusBadge>
        </div>
      </Panel>

      { showPermissionHint() && (
        <section class="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-amber-200">
          <h2 class="font-semibold text-amber-200">如何在浏览器里重新开启权限</h2>
          { deniedNames().length > 0 && (
            <p class="mt-1">
              当前被站点设置禁止的：
              { deniedNames().join('、') }
              。被禁止后 getUserMedia 不会再弹授权窗口，需要先手动改回「允许」：
            </p>
          ) }
          <ul class="mt-2 list-disc space-y-1 pl-5">
            <li>Chrome / Edge：地址栏左侧的锁形（或调音器）图标 → 网站设置 → 麦克风 / 摄像头 → 允许</li>
            <li>Firefox：地址栏左侧的权限图标 → 清除该站点的「已阻止」，或到 设置 → 隐私与安全 → 权限 里调整</li>
            <li>Safari：菜单栏 Safari → 设置…（偏好设置）→ 网站 → 麦克风 / 摄像头，把本站改为「允许」</li>
          </ul>
          { acquireFailure() === 'system-denied' && (
            <p class="mt-2">最近一次失败为 system-denied：操作系统层面禁用了浏览器。macOS 到 系统设置 → 隐私与安全性 → 麦克风 / 摄像头 → 勾选浏览器后重试。</p>
          ) }
          <p class="mt-2 text-amber-200/80">修改后本页状态会实时刷新（watchMediaPermission），再点「申请麦克风」验证。</p>
        </section>
      ) }

      <Panel title="模拟错误归类" description="把样本 DOMException 连同授权前后状态、是否有设备喂给 classifyMediaAccessError。">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField label="错误样本" value={ sample() } options={ ERROR_SAMPLES } onChange={ setSample } />
          <SelectField label="stateBefore" value={ stateBefore() } options={ STATE_OPTIONS } onChange={ setStateBefore } />
          <SelectField label="stateAfter" value={ stateAfter() } options={ STATE_OPTIONS } onChange={ setStateAfter } />
          <div class="flex items-end pb-2">
            <Toggle checked={ hasInputDevice() } onChange={ setHasInputDevice }>hasInputDevice</Toggle>
          </div>
        </div>
        <div class="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={ simulate }>归类</Button>
          <StatusBadge
            tone={ simulated()
              ? 'warning'
              : 'neutral' }
          >
            { simulated() ?? '未运行' }
          </StatusBadge>
        </div>
      </Panel>

      <Panel title="事件">
        <EventLog entries={ log.entries() } />
      </Panel>
    </PageShell>
  )
}

function formatBool(value: boolean | null): string {
  if (value === null) return '—'
  return value
    ? 'true'
    : 'false'
}

function describeError(error: unknown): string {
  if (error instanceof Error || error instanceof DOMException) return `${error.name}: ${error.message}`
  return String(error)
}

type SampleValue = typeof ERROR_SAMPLES[number]['value']

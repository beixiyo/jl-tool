/** playwright-cli 回归：默认原样输出，以及注入异步处理器后的真实录制链路；不播放、不 seek */
async function mediaDuration(page) {
  const runs = []
  for (const mode of ['none', 'delayed']) {
    await page.goto('http://localhost:5173/tests/audio-studio')
    for (const select of await page.getByRole('combobox', { name: 'finalizeBlob（时长修复需自行注入，见文档）', exact: true }).all()) {
      await select.selectOption(mode)
    }
    await page.getByRole('button', { name: '开启', exact: true }).click()
    await page.getByRole('button', { name: 'start', exact: true }).click()
    await page.getByRole('checkbox', { name: '来源使用上方混音输出（借用，不停止音轨）', exact: true }).check()
    await page.getByRole('button', { name: 'Recorder 创建并 start', exact: true }).click()
    /** 产生真实音频帧所需的采集时间 */
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'pause', exact: true }).click()
    await page.getByRole('button', { name: 'Recorder pause', exact: true }).click()
    await page.waitForTimeout(800)
    await page.getByRole('button', { name: 'resume', exact: true }).click()
    await page.getByRole('button', { name: 'Recorder resume', exact: true }).click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Recorder stop', exact: true }).click()
    await page.getByRole('button', { name: 'stop', exact: true }).click()
    await page.waitForFunction(() => [...document.querySelectorAll('audio')].filter((audio) => audio.readyState >= 1).length >= 3)
    const result = await page.evaluate(async () => {
      const raw = document.querySelector('audio[aria-label="原始 WebM"]')
      const output = document.querySelector('audio[aria-label="最终 WebM"]')
      const recorder = document.querySelector('audio[aria-label="其他 API 录音输出"]')
      const a = new Uint8Array(await (await fetch(raw.src)).arrayBuffer())
      const b = new Uint8Array(await (await fetch(output.src)).arrayBuffer())
      return {
        rawDuration: String(raw.duration),
        outputDuration: String(output.duration),
        recorderDuration: String(recorder.duration),
        unchanged: a.length === b.length && a.every((value, i) => value === b[i]),
        untouched: [raw, output, recorder].every((audio) => audio.paused && audio.currentTime === 0 && audio.played.length === 0),
      }
    })
    if (!result.unchanged || !result.untouched || [result.rawDuration, result.outputDuration, result.recorderDuration].some((value) => value !== 'Infinity')) {
      throw new Error(`不应内置容器修改或播放/seek：${JSON.stringify(result)}`)
    }
    if (mode === 'delayed' && await page.getByText(/finalizeBlob · \d+ bytes/).count() < 2) throw new Error('两个录制器的注入回调没有交付到页面')
    await page.getByRole('button', { name: '全部释放', exact: true }).click()
    await page.getByRole('button', { name: 'Recorder destroy', exact: true }).click()
    runs.push({ mode, ...result })
  }
  return { status: 'PASS', runs }
}

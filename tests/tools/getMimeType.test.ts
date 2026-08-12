import { describe, expect, it } from 'vitest'
import { getMimeType } from '@/fileTool/getMimeType'

describe('getMimeType', () => {
  // --- Test Cases for Base64 Data URLs ---
  it('should return mime type for a valid Base64 Data URL', async () => {
    const url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    const mime = await getMimeType(url)
    expect(mime).toBe('image/png')
  })

  it('should return "unknown" for an invalid Base64 Data URL (missing mime)', async () => {
    const url = 'data:;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    const mime = await getMimeType(url)
    console.log(mime)
    expect(mime).toBe('unknown')
  })
})

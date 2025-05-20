import { getFilenameAndExt } from '@/fileTool'
import { describe, expect, it } from 'vitest'


describe('getFilenameAndExt 文件名解析', () => {
  // 基础功能测试
  it('标准URL带后缀', () => {
    const result = getFilenameAndExt('https://example.com/path/to/document.pdf')
    expect(result).toEqual({ name: 'document', ext: 'pdf' })
  })

  it('标准路径带后缀', () => {
    const result = getFilenameAndExt('/var/www/file.txt')
    expect(result).toEqual({ name: 'file', ext: 'txt' })
  })

  // 边界情况测试
  it('无后缀文件', () => {
    expect(getFilenameAndExt('README')).toEqual({ name: 'README', ext: '' })
    expect(getFilenameAndExt('https://site.com/config')).toEqual({ name: 'config', ext: '' })
  })

  // 特殊字符测试
  it('含特殊字符的文件名', () => {
    expect(getFilenameAndExt('my file@home.json')).toEqual({ name: 'my file@home', ext: 'json' })
    expect(getFilenameAndExt('https://site.com/测试%20文件.测试', true)).toEqual({ name: '测试 文件', ext: '测试' })
  })

  // 路径边界测试
  it('Windows路径', () => {
    expect(getFilenameAndExt('C:\\Documents\\file.doc')).toEqual({ name: 'file', ext: 'doc' })
  })

  it('空路径', () => {
    expect(getFilenameAndExt('')).toEqual({ name: '', ext: '' })
  })

  it('带哈希的URL', () => {
    const result = getFilenameAndExt('https://site.com/app.js#version=1.0')
    expect(result).toEqual({ name: 'app', ext: 'js' })
  })

  // 隐藏文件测试
  it('Unix隐藏文件', () => {
    expect(getFilenameAndExt('/home/user/.env')).toEqual({ name: '', ext: 'env' })
    expect(getFilenameAndExt('.gitignore')).toEqual({ name: '', ext: 'gitignore' })
  })
})
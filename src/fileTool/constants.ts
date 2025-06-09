/* eslint-disable no-sparse-arrays */
import type { CompressedType, ImageType } from './types'

/**
 * @description 常用文件后缀名与 MIME 类型对应关系
 * @example
 * ```ts
 * { png: 'image/png', ... }
 * ```
 */
export const mimeFromExt = {
  /** 图片 */
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
  'bmp': 'image/bmp',
  'tif': 'image/tiff',
  'tiff': 'image/tiff',
  'psd': 'image/vnd.adobe.photoshop',
  'avif': 'image/avif',
  'heic': 'image/heic',
  'heif': 'image/heif',

  /** 视频 */
  'mp4': 'video/mp4',
  'mov': 'video/quicktime',
  'webm': 'video/webm',
  'mkv': 'video/x-matroska',
  'avi': 'video/x-msvideo',
  'wmv': 'video/x-ms-wmv',
  'flv': 'video/x-flv',
  'm4v': 'video/x-m4v',
  '3gp': 'video/3gpp',

  /** 音频 */
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  'm4a': 'audio/mp4',
  'flac': 'audio/flac',
  'aac': 'audio/aac',
  'mid': 'audio/midi',
  'midi': 'audio/midi',
  'amr': 'audio/amr',

  /** 文档 */
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'txt': 'text/plain',
  'rtf': 'application/rtf',
  'csv': 'text/csv',
  'odt': 'application/vnd.oasis.opendocument.text',
  'ods': 'application/vnd.oasis.opendocument.spreadsheet',
  'odp': 'application/vnd.oasis.opendocument.presentation',

  /** 编程文件 */
  'html': 'text/html',
  'htm': 'text/html',
  'css': 'text/css',
  'js': 'text/javascript',
  'json': 'application/json',
  'xml': 'application/xml',
  'yml': 'text/yaml',
  'yaml': 'text/yaml',
  'md': 'text/markdown',

  /** 压缩包 */
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  'tar': 'application/x-tar',
  'gz': 'application/gzip',
  'bz2': 'application/x-bzip2',
  'xz': 'application/x-xz',

  /** 字体 */
  'ttf': 'font/ttf',
  'otf': 'font/otf',
  'woff': 'font/woff',
  'woff2': 'font/woff2',
  'eot': 'application/vnd.ms-fontobject',

  /** 其他 */
  'exe': 'application/x-msdownload',
  'dmg': 'application/x-apple-diskimage',
  'apk': 'application/vnd.android.package-archive',
  'deb': 'application/x-debian-package',
  'rpm': 'application/x-rpm',
  'iso': 'application/x-iso9660-image',
  'torrent': 'application/x-bittorrent',
  'bin': 'application/octet-stream',
  'dll': 'application/x-msdownload',
  'wasm': 'application/wasm',
} as const

/** 图片魔数检测表 */
export const IMAGE_SIGNATURES: Record<ImageType, any[]> = {
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46, , , , , 0x57, 0x45, 0x42, 0x50],
  ],
  'image/bmp': [[0x42, 0x4D]],
  'image/tiff': [[0x49, 0x49, 0x2A, 0x00], [0x4D, 0x4D, 0x00, 0x2A]],
}

/** 压缩包魔数检测表 */
export const COMPRESSION_SIGNATURES: Record<CompressedType, any[]> = {
  'application/zip': [
    [0x50, 0x4B, 0x03, 0x04], // 标准ZIP
    [0x50, 0x4B, 0x05, 0x06], // 空文档ZIP
    [0x50, 0x4B, 0x07, 0x08], // 分卷ZIP
  ],
  'application/x-rar-compressed': [
    [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00], // RAR4
    [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01, 0x00], // RAR5
  ],
  'application/x-7z-compressed': [
    [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C],
  ],
  'application/x-tar': [
    [0x75, 0x73, 0x74, 0x61, 0x72], // ustar
  ],
  'application/gzip': [
    [0x1F, 0x8B, 0x08],
  ],
}

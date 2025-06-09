export type FileTypeResult = {
  isText: boolean
  isImage: boolean
  mimeType: ImageType | CompressedType | 'text/plain' | null
  isCompressed: boolean
}

export type InputType = Blob | Uint8Array | ArrayBuffer | string | DataView

export type ImageType =
  | 'image/png'
  | 'image/jpeg'
  | 'image/gif'
  | 'image/webp'
  | 'image/bmp'
  | 'image/tiff'

export type CompressedType =
  | 'application/zip'
  | 'application/x-rar-compressed'
  | 'application/x-7z-compressed'
  | 'application/x-tar'
  | 'application/gzip'

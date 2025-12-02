export const COMMON_FORMATS = [
  // ASR 推荐格式（按优先级）
  'audio/mp4;codecs=mp4a.40.2', // AAC - 最佳兼容性
  'audio/webm;codecs=opus', // Opus - 最佳质量/压缩比
  'audio/webm', // WebM 基础格式

  /** 其他常见格式 */
  'audio/ogg;codecs=opus', // Opus Ogg
  'audio/ogg', // Ogg 基础
  'audio/mp4', // MP4 基础
  'audio/mpeg', // MP3
  'audio/wav', // WAV 无损
  'audio/x-wav', // WAV 变体

  /** 高级编码格式 */
  'audio/mp4;codecs=mp4a.40.5', // AAC HE
  'audio/mp4;codecs=mp4a.40.2;profile=aac_low', // AAC 低复杂度

  /** 其他 WebM 变体 */
  'audio/webm;codecs=vp8', // WebM VP8
  'audio/webm;codecs=vp9', // WebM VP9

  /** 实验性格式 */
  'audio/mp4;codecs=ac-3', // Dolby Digital
  'audio/mp4;codecs=ec-3', // Dolby Digital Plus
]

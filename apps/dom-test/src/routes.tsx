import { AudioLaneRecorderPage } from '@app/pages/audio-lane-recorder/AudioLaneRecorderPage'
import { AudioStudioPage } from '@app/pages/audio-studio/AudioStudioPage'
import { CameraPage } from '@app/pages/camera/CameraPage'
import { CanvasPage } from '@app/pages/canvas/CanvasPage'
import { ClockPage } from '@app/pages/clock/ClockPage'
import { CreateAnimationByTimePage } from '@app/pages/create-animation-by-time/CreateAnimationByTimePage'
import { DebouncePage } from '@app/pages/debounce/DebouncePage'
import { DisableDebugPage } from '@app/pages/disable-debug/DisableDebugPage'
import { DisplayAudioPage } from '@app/pages/display-audio/DisplayAudioPage'
import { MediaOverviewPage } from '@app/pages/media-overview/MediaOverviewPage'
import { MediaPermissionPage } from '@app/pages/media-permission/MediaPermissionPage'
import { MicrophoneInputPage } from '@app/pages/microphone-input/MicrophoneInputPage'
import { PcmCapturePage } from '@app/pages/pcm-capture/PcmCapturePage'
import { PreloadPage } from '@app/pages/preload/PreloadPage'
import { RecorderPage } from '@app/pages/recorder/RecorderPage'
import { ScheduleTaskPage } from '@app/pages/schedule-task/ScheduleTaskPage'
import { ScreenRecordPage } from '@app/pages/screen-record/ScreenRecordPage'
import { ScrollTriggerXPage } from '@app/pages/scroll-trigger-x/ScrollTriggerXPage'
import { ScrollTriggerPage } from '@app/pages/scroll-trigger/ScrollTriggerPage'
import { SpeakToTxtPage } from '@app/pages/speak-to-txt/SpeakToTxtPage'
import { SpeakerPage } from '@app/pages/speaker/SpeakerPage'
import { StreamDownloaderPage } from '@app/pages/stream-downloader/StreamDownloaderPage'
import { TypewriterEffectPage } from '@app/pages/typewriter-effect/TypewriterEffectPage'
import type { Component } from 'solid-js'
import { ROUTE_META } from './routeMeta'

const PAGE_COMPONENTS: readonly Component[] = [
  ClockPage,
  CreateAnimationByTimePage,
  TypewriterEffectPage,
  DebouncePage,
  DisableDebugPage,
  ScheduleTaskPage,
  PreloadPage,
  StreamDownloaderPage,
  CanvasPage,
  ScrollTriggerPage,
  ScrollTriggerXPage,
  MediaOverviewPage,
  RecorderPage,
  PcmCapturePage,
  MediaPermissionPage,
  MicrophoneInputPage,
  AudioLaneRecorderPage,
  DisplayAudioPage,
  AudioStudioPage,
  SpeakerPage,
  SpeakToTxtPage,
  CameraPage,
  ScreenRecordPage,
]

export const PAGE_ROUTES = ROUTE_META.map((meta, index) => ({
  ...meta,
  component: PAGE_COMPONENTS[index],
}))

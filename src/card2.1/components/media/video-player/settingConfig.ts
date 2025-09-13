import type { SettingConfig } from '@/card2.1/types/setting-config'
export interface VideoPlayerCustomize { showTitle: boolean; showControls: boolean; title: string; backgroundColor: string; borderColor: string; borderRadius: number }
export interface VideoPlayerConfig { type: 'video-player'; root: { transform: { rotate: number; scale: number } }; customize: VideoPlayerCustomize }
export const customConfig: VideoPlayerCustomize = { showTitle: true, showControls: true, title: '视频播放器', backgroundColor: 'transparent', borderColor: 'var(--border-color)', borderRadius: 8 }
export const videoPlayerSettingConfig: SettingConfig<VideoPlayerCustomize> = [{ group: '内容设置', items: [{ key: 'title', label: '标题', type: 'input', defaultValue: '视频播放器' }] }]
import { fullscreenFeature } from '@videojs/react'

// iPhone Safari lacks the element Fullscreen API; Video.js then falls back to <video>.webkitSetPresentationMode
function usesVideoPresentationFullscreen(video: HTMLVideoElement): boolean {
  return !document.fullscreenEnabled && 'webkitSetPresentationMode' in video
}

/**
 * Fullscreen that also works before the first play on iPhone.
 *
 * iOS ignores `preload`, so an unplayed video has no metadata, and `webkitSetPresentationMode('fullscreen')`
 * silently does nothing without it. A gesture-initiated play() both starts loading and lifts WebKit's
 * per-element "fullscreen needs a user gesture" restriction, so entering on `loadedmetadata` is still allowed.
 */
export const metadataGatedFullscreenFeature: typeof fullscreenFeature = {
  ...fullscreenFeature,
  state: (context) => {
    const fullscreen = fullscreenFeature.state(context)
    let pendingEntry: AbortController | null = null

    return {
      ...fullscreen,
      requestFullscreen() {
        const video = context.target().media as unknown as HTMLVideoElement
        if (!usesVideoPresentationFullscreen(video) || video.readyState >= HTMLMediaElement.HAVE_METADATA) {
          return fullscreen.requestFullscreen()
        }

        pendingEntry?.abort()
        const entry = new AbortController()
        pendingEntry = entry
        video.addEventListener(
          'loadedmetadata',
          () => {
            entry.abort()
            void fullscreen.requestFullscreen()
          },
          { signal: entry.signal },
        )
        return video.play().catch(() => entry.abort())
      },
    }
  },
}

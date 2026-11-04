// The mini-program detail owns scrolling. Keep this adapter local to its
// same-origin iframe; native App and the admin preview keep their own gestures.
export function attachFrameLayout(frame, scrollHost, { contentSized = true } = {}) {
  let cleanupDocument = () => {}
  const onLoad = () => {
    cleanupDocument()
    const doc = frame.contentDocument
    const win = frame.contentWindow
    if (!doc?.body || !win) return
    const style = doc.createElement('style')
    // Fixed (non-grid) canvases use an absolutely positioned ScaleScreen whose
    // viewport must retain its explicit height. Grid canvases can grow naturally.
    style.textContent = `${
      contentSized
        ? `
      html, body, #root { height: auto !important; min-height: 0 !important; overflow: hidden !important; }
      .thingsvis-embed-surface { height: auto !important; min-height: 0 !important; overflow: visible !important; }
    `
        : ''
    }
      .thingsvis-embed-surface, .thingsvis-embed-surface * { touch-action: pan-y pinch-zoom !important; }
    `
    doc.head.append(style)
    let scheduled = 0
    let surface
    let start
    const measure = () => {
      scheduled = 0
      if (!contentSized) return
      const current = doc.querySelector('.thingsvis-embed-surface')
      if (!current) return
      if (surface !== current) {
        resize.disconnect()
        surface = current
        resize.observe(surface)
        for (const child of surface.children) resize.observe(child)
      }
      const height = Math.ceil(Math.max(surface.scrollHeight, surface.getBoundingClientRect().height))
      if (height > 0 && frame.style.height !== `${height}px`) frame.style.height = `${height}px`
    }
    const schedule = () => {
      if (!scheduled) scheduled = win.requestAnimationFrame(measure)
    }
    const resize = new win.ResizeObserver(schedule)
    const mutation = new win.MutationObserver(schedule)
    mutation.observe(doc.body, { childList: true, subtree: true })
    const wheel = (event) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scrollHost.clientHeight : 1
      scrollHost.scrollTop += event.deltaY * unit
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    const touchStart = (event) => {
      start = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null
    }
    const touchMove = (event) => {
      if (!start || event.touches.length !== 1) return
      const dx = event.touches[0].clientX - start.x
      const dy = event.touches[0].clientY - start.y
      // Let the browser perform native vertical scrolling and momentum, instead
      // of allowing a chart's touchmove handler to prevent the page gesture.
      if (Math.abs(dy) > 6 && Math.abs(dy) > Math.abs(dx)) event.stopImmediatePropagation()
    }
    win.addEventListener('wheel', wheel, { capture: true, passive: false })
    win.addEventListener('touchstart', touchStart, { capture: true, passive: true })
    win.addEventListener('touchmove', touchMove, { capture: true, passive: true })
    win.addEventListener('resize', schedule)
    schedule()
    cleanupDocument = () => {
      win.cancelAnimationFrame(scheduled)
      resize.disconnect()
      mutation.disconnect()
      win.removeEventListener('wheel', wheel, true)
      win.removeEventListener('touchstart', touchStart, true)
      win.removeEventListener('touchmove', touchMove, true)
      win.removeEventListener('resize', schedule)
      style.remove()
    }
  }
  frame.addEventListener('load', onLoad)
  return () => {
    frame.removeEventListener('load', onLoad)
    cleanupDocument()
  }
}

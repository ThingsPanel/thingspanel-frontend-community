// The history pickers give an inclusive [start, end] in milliseconds and the
// request sends the half-open [start, end + 1ms), so the span the backend limits
// is end - start + 1, not end - start.
export const inclusiveSpanMs = (start: number, end: number) => end - start + 1

export const exceedsInclusiveSpan = (start: number, end: number, maxMs: number) => inclusiveSpanMs(start, end) > maxMs

/** Latest start that still keeps an inclusive range ending at `end` within `maxMs`. */
export const earliestStartWithin = (end: number, maxMs: number) => end - maxMs + 1

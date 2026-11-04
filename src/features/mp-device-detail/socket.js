// The wire format matches the existing mobile runtime; no messages cross the Mini Program boundary.
export function createSocket(url) {
  const socket = new WebSocket(url)
  return {
    onOpen: (callback) => socket.addEventListener('open', callback),
    onMessage: (callback) => socket.addEventListener('message', callback),
    onError: (callback) => socket.addEventListener('error', callback),
    onClose: (callback) => socket.addEventListener('close', callback),
    send({ data, fail }) {
      try {
        socket.send(data)
      } catch (error) {
        fail?.(error)
      }
    },
    close({ code = 1000 } = {}) {
      socket.close(code)
    }
  }
}

// The token is stored before fetching user details. Both rejected requests and
// unsuccessful responses must discard that partially initialized login.
export async function initializeExternalSession(load: () => Promise<{ loop: boolean }>, clear: () => Promise<void>) {
  try {
    if (!(await load()).loop) throw new Error('AUTH_FAILED')
  } catch (error) {
    await clear()
    throw error
  }
}

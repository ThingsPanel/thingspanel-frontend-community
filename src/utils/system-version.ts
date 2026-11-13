/** Platform version helpers. SemVer 2.0 precedence incl. prerelease: v1.4.0-beta.1 < v1.4.0-beta.2 < v1.4.0. */

const SEMVER_RE = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z.-]+)?$/i

export interface ParsedVersion {
  core: [number, number, number]
  pre: string[]
}

export function parseVersion(value: unknown): ParsedVersion | null {
  if (typeof value !== 'string') return null
  const m = SEMVER_RE.exec(value.trim())
  if (!m) return null
  return { core: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ? m[4].split('.') : [] }
}

export function isPrerelease(value: unknown): boolean {
  return (parseVersion(value)?.pre.length ?? 0) > 0
}

/** Negative / 0 / positive like a sort comparator; null when either side is not a version. */
export function compareVersions(a: unknown, b: unknown): number | null {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  if (!pa || !pb) return null
  for (let i = 0; i < 3; i += 1) if (pa.core[i] !== pb.core[i]) return pa.core[i] - pb.core[i]
  if (!pa.pre.length || !pb.pre.length) return pb.pre.length - pa.pre.length // a release outranks its prereleases
  for (let i = 0; i < Math.max(pa.pre.length, pb.pre.length); i += 1) {
    const x = pa.pre[i]
    const y = pb.pre[i]
    if (x === undefined) return -1
    if (y === undefined) return 1
    if (x === y) continue
    const xn = /^\d+$/.test(x)
    const yn = /^\d+$/.test(y)
    if (xn && yn) return Number(x) - Number(y)
    if (xn !== yn) return xn ? -1 : 1
    return x < y ? -1 : 1
  }
  return 0
}

/** Highest version among tag names; prereleases only count when `includePrerelease` (running a beta). */
export function pickLatestVersion(names: unknown[], includePrerelease: boolean): string | undefined {
  let best: string | undefined
  for (const n of names) {
    if (typeof n !== 'string' || !parseVersion(n)) continue
    if (!includePrerelease && isPrerelease(n)) continue
    if (best === undefined || (compareVersions(n, best) ?? 0) > 0) best = n
  }
  return best
}

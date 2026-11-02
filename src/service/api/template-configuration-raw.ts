/**
 * Byte-preserving edits of the template `configuration` object inside a native
 * template response body.
 *
 * The template PATCH contract replaces `configuration` as a whole. Re-encoding
 * the parsed object would rewrite every untouched value through JavaScript
 * numbers, which silently rounds JSON integers above 2^53 (for example a
 * provider parameter or a stored custom-field default). Splicing the one
 * member that changed keeps every other token exactly as the server returned
 * it, so an unrelated edit cannot corrupt precision it never touched.
 */

export type TemplateConfigurationMember = 'topicMappings' | 'processingScripts' | 'customFieldDefinitions'

interface ValueRange {
  start: number
  end: number
}

function isWhitespace(char: string): boolean {
  return char === ' ' || char === '\n' || char === '\r' || char === '\t'
}

function skipWhitespace(text: string, index: number): number {
  let cursor = index
  while (cursor < text.length && isWhitespace(text[cursor])) cursor += 1
  return cursor
}

function scanString(text: string, index: number): number {
  if (text[index] !== '"') throw new Error('Expected a JSON string')
  let cursor = index + 1
  while (cursor < text.length) {
    const char = text[cursor]
    if (char === '\\') {
      cursor += 2
      continue
    }
    if (char === '"') return cursor + 1
    cursor += 1
  }
  throw new Error('Unterminated JSON string')
}

function scanValue(text: string, index: number): number {
  const char = text[index]
  if (char === '"') return scanString(text, index)
  if (char === '{' || char === '[') {
    let depth = 0
    let cursor = index
    while (cursor < text.length) {
      const current = text[cursor]
      if (current === '"') {
        cursor = scanString(text, cursor)
        continue
      }
      if (current === '{' || current === '[') depth += 1
      else if (current === '}' || current === ']') {
        depth -= 1
        if (depth === 0) return cursor + 1
      }
      cursor += 1
    }
    throw new Error('Unterminated JSON container')
  }
  let cursor = index
  while (cursor < text.length && !',}] \n\r\t'.includes(text[cursor])) cursor += 1
  if (cursor === index) throw new Error('Expected a JSON value')
  return cursor
}

/** Returns the range of `key`'s value inside the object that starts at `objectStart`. */
function findMemberRange(text: string, objectStart: number, key: string): ValueRange | undefined {
  if (text[objectStart] !== '{') throw new Error('Expected a JSON object')
  let cursor = objectStart + 1
  while (cursor < text.length) {
    cursor = skipWhitespace(text, cursor)
    if (text[cursor] === '}') return undefined
    const keyEnd = scanString(text, cursor)
    const memberKey = JSON.parse(text.slice(cursor, keyEnd)) as string
    cursor = skipWhitespace(text, keyEnd)
    if (text[cursor] !== ':') throw new Error('Expected ":" after a JSON member name')
    const valueStart = skipWhitespace(text, cursor + 1)
    const valueEnd = scanValue(text, valueStart)
    if (memberKey === key) return { start: valueStart, end: valueEnd }
    cursor = skipWhitespace(text, valueEnd)
    if (text[cursor] === ',') cursor += 1
  }
  throw new Error('Unterminated JSON object')
}

function requireObject(text: string, range: ValueRange, label: string): ValueRange {
  if (text[range.start] !== '{') throw new Error(`Template response ${label} is not a JSON object`)
  return range
}

function requireRootObject(text: string): number {
  const rootStart = skipWhitespace(text, 0)
  if (text[rootStart] !== '{') throw new Error('Template response is not a JSON object')
  return rootStart
}

/**
 * Resolves the value at `path` inside `configuration`. Every segment except the
 * last must be an object; the last value may be any JSON value so callers can
 * replace a single boolean without re-encoding its siblings.
 */
function findConfigurationPath(text: string, path: readonly string[]): ValueRange {
  if (path.length === 0) throw new Error('Template configuration path must not be empty')
  const rootStart = requireRootObject(text)
  const data = findMemberRange(text, rootStart, 'data')
  if (!data) throw new Error('Template response is missing data')
  const configuration = findMemberRange(text, requireObject(text, data, 'data').start, 'configuration')
  if (!configuration) throw new Error('Template response is missing configuration')
  let current = requireObject(text, configuration, 'configuration')
  for (const segment of path.slice(0, -1)) {
    const next = findMemberRange(text, current.start, segment)
    if (!next) throw new Error(`Template configuration is missing ${path.join('.')}`)
    current = requireObject(text, next, `configuration.${path.join('.')}`)
  }
  const target = findMemberRange(text, current.start, path[path.length - 1])
  if (!target) throw new Error(`Template configuration is missing ${path.join('.')}`)
  return target
}

/**
 * Replaces the value found at `path` inside `configuration` and leaves every
 * other byte of the response untouched.
 */
export function replaceConfigurationPath(rawText: string, path: readonly string[], valueJson: string): string {
  if (valueJson.trim() === '') throw new Error('Replacement value must not be empty')
  const target = findConfigurationPath(rawText, path)
  return rawText.slice(0, target.start) + valueJson + rawText.slice(target.end)
}

/** Reads the value at `path` as the server's exact JSON text. */
export function readConfigurationPath(rawText: string, path: readonly string[]): string {
  const target = findConfigurationPath(rawText, path)
  return rawText.slice(target.start, target.end)
}

/**
 * Replaces one `configuration` member with `valueJson` and leaves every other
 * byte of the response untouched.
 */
export function replaceConfigurationMember(
  rawText: string,
  member: TemplateConfigurationMember,
  valueJson: string
): string {
  const rootStart = requireRootObject(rawText)
  const data = findMemberRange(rawText, rootStart, 'data')
  if (!data) throw new Error('Template response is missing data')
  const configuration = findMemberRange(rawText, requireObject(rawText, data, 'data').start, 'configuration')
  if (!configuration) throw new Error('Template response is missing configuration')
  requireObject(rawText, configuration, 'configuration')
  const target = findMemberRange(rawText, configuration.start, member)
  if (!target) throw new Error(`Template configuration is missing ${member}`)
  return rawText.slice(0, target.start) + valueJson + rawText.slice(target.end)
}

/** Reads one `configuration` member as the server's exact JSON text. */
export function readConfigurationMember(rawText: string, member: TemplateConfigurationMember): string {
  const rootStart = requireRootObject(rawText)
  const data = findMemberRange(rawText, rootStart, 'data')
  if (!data) throw new Error('Template response is missing data')
  const configuration = findMemberRange(rawText, requireObject(rawText, data, 'data').start, 'configuration')
  if (!configuration) throw new Error('Template response is missing configuration')
  const target = findMemberRange(rawText, requireObject(rawText, configuration, 'configuration').start, member)
  if (!target) throw new Error(`Template configuration is missing ${member}`)
  return rawText.slice(target.start, target.end)
}

/** Builds the exact `configuration` text that the template PATCH body must carry. */
export function replaceConfigurationMemberAndExtract(
  rawText: string,
  member: TemplateConfigurationMember,
  valueJson: string
): string {
  const patched = replaceConfigurationMember(rawText, member, valueJson)
  return readConfigurationObject(patched)
}

/** Extracts the whole `configuration` object as the server's exact JSON text. */
export function readConfigurationObject(rawText: string): string {
  const rootStart = requireRootObject(rawText)
  const data = findMemberRange(rawText, rootStart, 'data')
  if (!data) throw new Error('Template response is missing data')
  const configuration = findMemberRange(rawText, requireObject(rawText, data, 'data').start, 'configuration')
  if (!configuration) throw new Error('Template response is missing configuration')
  const object = requireObject(rawText, configuration, 'configuration')
  return rawText.slice(object.start, object.end)
}

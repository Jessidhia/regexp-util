/**
 * Wrapper for functions to be given to `String.prototype.replace`, to make working
 * with named captures easier and more type-safe.
 *
 * @template T the capturing groups expected from the regexp. `string` keys are named,
 *   `number` keys are ordered captures. Note that named captures occupy their place
 *   in the capture order.
 * @param replacer The function to be wrapped. The first argument will have the
 *   shape of `T`, and its result will be forwarded to `String.prototype.replace`.
 */
export function named<T extends Partial<Record<string | number, string>> = {}>(
  replacer: (captures: { 0: string } & T, index: number, original: string) => string
) {
  const namedCapturesWrapper: (match: string, ...rest: any[]) => string = (...args) => {
    const { length } = args
    const named: string | Partial<Record<string, string>> = args[length - 1]
    const captures: { 0: string } & T = Object.create(null)
    if (typeof named === 'string') {
      // the regexp used does not use named captures at all
      args.slice(0, -2).forEach((value, index) => {
        Object.defineProperty(captures, index, { configurable: true, writable: true, value })
      })
      return replacer(captures, args[length - 2], named)
    }
    // the regexp has named captures; copy named own properties to captures,
    // then copy the numeric matches.
    Object.assign(captures, named)
    args.slice(0, -3).forEach((value, index) => {
      if (index in captures) {
        throw new RangeError(`Numeric name ${index} used as a regexp capture name`)
      }
      Object.defineProperty(captures, index, { configurable: true, writable: true, value })
    })
    return replacer(captures, args[length - 3], args[length - 2])
  }
  return namedCapturesWrapper
}

// the first overload is here to preserve refinements if `null` was already
// checked for and excluded from the type of exec/match result.
/**
 * Helper to extract the named capturing groups from the result of
 * `RegExp.prototype.exec` or `String.prototype.match`.
 *
 * @template T type definition for the available capturing groups
 * @param result the result of `RegExp.prototype.exec` or `String.prototype.match`
 * @returns the contents of the `.groups` property but typed as `T`
 * @throws if `.groups` is `undefined`; this only happens on regexps without captures
 */
export function groups<T extends Partial<Record<string, string>> = {}>(
  result: RegExpMatchArray | RegExpExecArray
): T
/**
 * Helper to extract the named capturing groups from the result of `RegExp.prototype.exec`
 * or `String.prototype.match`.
 *
 * @template T type definition for the available capturing groups
 * @param result the result of `RegExp.prototype.exec` or `String.prototype.match`
 * @returns the contents of the `.groups` property but typed as `T`, or `null` if
 *   there was no match
 * @throws if `.groups` is `undefined`; this only happens on regexps without captures
 */
export function groups<T extends Partial<Record<string, string>> = {}>(
  result: RegExpMatchArray | RegExpExecArray | null
): T | null
/**
 * Helper to extract the named capturing groups from the result of `RegExp.prototype.exec`
 * or `String.prototype.match`.
 *
 * @template T type definition for the available capturing groups
 * @param result the result of `RegExp.prototype.exec` or `String.prototype.match`
 * @returns the contents of the `.groups` property but typed as `T`, or `null` if
 *   there was no match
 * @throws if `.groups` is `undefined`; this only happens on regexps without captures
 */
export function groups<T extends Partial<Record<string, string>> = {}>(
  result: RegExpMatchArray | RegExpExecArray | null
): T | null {
  if (result === null) {
    return null
  }
  if (result.groups === undefined) {
    // this can also happen if a polyfill / babel transform is missing
    throw new RangeError('Attempted to read the named captures of a Regexp without named captures')
  }
  return result.groups as T
}

/**
 * Returns all matches of a given regexp on the given target.
 *
 * Only returns a single match for non-`g` regexps.
 *
 * @param regexp The regexp to match
 * @param target The string to be matched
 */
export function* execAll(regexp: RegExp, target: string) {
  while (true) {
    const result = regexp.exec(target)
    if (result === null) {
      return
    }
    yield result
    if (!regexp.global) {
      return
    }
  }
}

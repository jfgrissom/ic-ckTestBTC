/**
 * Error filtering utilities to distinguish between application and external errors
 * Helps filter out browser extension and external script errors from app logs
 */

export interface ErrorClassification {
  type: 'application' | 'extension' | 'external' | 'network'
  source: string
  shouldLog: boolean
  isUserFacing: boolean
}

/**
 * Browser extension error patterns
 * Common patterns from ad blockers, password managers, dev tools, etc.
 */
const EXTENSION_ERROR_PATTERNS = [
  /inject\.js/i,
  /content[_-]script/i,
  /extension/i,
  /chrome[_-]extension/i,
  /moz[_-]extension/i,
  /safari[_-]extension/i,
  /A listener indicated an asynchronous response.*message channel closed/i,
  /Non-Error promise rejection captured/i,
  /Script error/i,
  /ResizeObserver loop limit exceeded/i,
  /^Object$/,
  /SecurityError.*Permission denied/i,
] as const

/**
 * External script error patterns
 * Patterns from analytics, ads, social media widgets, etc.
 */
const EXTERNAL_SCRIPT_PATTERNS = [
  /google.*analytics/i,
  /facebook.*sdk/i,
  /twitter.*widget/i,
  /doubleclick/i,
  /adsystem/i,
  /gtm\.js/i,
  /ga\.js/i,
] as const

/**
 * Network/fetch error patterns
 */
const NETWORK_ERROR_PATTERNS = [
  /fetch/i,
  /XMLHttpRequest/i,
  /Network.*request.*failed/i,
  /Failed to fetch/i,
  /ERR_NETWORK/i,
  /ERR_INTERNET_DISCONNECTED/i,
] as const

/**
 * Application error patterns that should always be logged
 */
const APPLICATION_ERROR_PATTERNS = [
  /AuthClient/i,
  /Internet.*Identity/i,
  /canister/i,
  /actor/i,
  /principal/i,
  /dfx/i,
  /ic-/i,
  /ckTestBTC/i,
  /backend/i,
] as const

/**
 * Classify an error based on its message, stack trace, and source
 */
export const classifyError = (
  error: Error | string,
  source?: string,
  stack?: string
): ErrorClassification => {
  const errorMessage = typeof error === 'string' ? error : error.message
  const errorStack =
    stack || (typeof error === 'object' ? error.stack || '' : '')
  const errorSource = source || 'unknown'

  // Check for browser extension errors first (most specific patterns)
  if (
    EXTENSION_ERROR_PATTERNS.some(
      pattern => pattern.test(errorMessage) || pattern.test(errorStack)
    )
  ) {
    return {
      type: 'extension',
      source: errorSource,
      shouldLog: false, // Don't log extension errors in production
      isUserFacing: false,
    }
  }

  // Check for external script errors (specific external patterns)
  if (
    EXTERNAL_SCRIPT_PATTERNS.some(
      pattern => pattern.test(errorMessage) || pattern.test(errorStack)
    )
  ) {
    return {
      type: 'external',
      source: errorSource,
      shouldLog: false, // Don't log external script errors
      isUserFacing: false,
    }
  }

  // Check for network errors (specific network patterns)
  if (
    NETWORK_ERROR_PATTERNS.some(
      pattern => pattern.test(errorMessage) || pattern.test(errorStack)
    )
  ) {
    return {
      type: 'network',
      source: errorSource,
      shouldLog: true, // Log network errors for debugging
      isUserFacing: true, // Network errors affect user experience
    }
  }

  // Check for application-specific errors (after other specific patterns)
  if (
    APPLICATION_ERROR_PATTERNS.some(
      pattern => pattern.test(errorMessage) || pattern.test(errorStack)
    )
  ) {
    return {
      type: 'application',
      source: errorSource,
      shouldLog: true,
      isUserFacing: true,
    }
  }

  // Default to application error if no patterns match
  return {
    type: 'application',
    source: errorSource,
    shouldLog: true,
    isUserFacing: true,
  }
}

/**
 * Enhanced console error filter for development
 * Wraps console.error to filter out extension/external errors
 */
export const createFilteredConsoleError = () => {
  // eslint-disable-next-line no-console
  const originalConsoleError = console.error

  return (...args: unknown[]) => {
    // Convert arguments to strings for pattern matching
    const errorString = args
      .map(arg => (typeof arg === 'string' ? arg : String(arg)))
      .join(' ')

    const classification = classifyError(errorString)

    // Only log application errors and network errors in development
    if (classification.shouldLog || import.meta.env.DEV) {
      // Add classification info in development
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        originalConsoleError(`[${classification.type.toUpperCase()}]`, ...args)
      } else {
        // eslint-disable-next-line no-console
        originalConsoleError(...args)
      }
    }
  }
}

/**
 * Enhanced error reporting for error boundaries
 */
export const reportError = (
  error: Error,
  errorInfo?: unknown,
  context?: string
) => {
  const classification = classifyError(error, context, error.stack)

  // Only report application and network errors
  if (classification.shouldLog) {
    // eslint-disable-next-line no-console
    console.error(
      `[${classification.type.toUpperCase()}] ${context || 'Error'}:`,
      {
        message: error.message,
        stack: error.stack,
        classification,
        errorInfo,
        timestamp: new Date().toISOString(),
        userAgent:
          typeof window !== 'undefined'
            ? window.navigator.userAgent
            : undefined,
      }
    )
  }

  return classification
}

/**
 * Check if an error should be displayed to the user
 */
export const shouldDisplayError = (error: Error, context?: string): boolean => {
  const classification = classifyError(error, context, error.stack)
  return classification.isUserFacing
}

/**
 * Setup global error filtering in development
 * Call this in your app initialization
 */
export const setupErrorFiltering = () => {
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    // Replace console.error with filtered version
    // eslint-disable-next-line no-console
    console.error = createFilteredConsoleError()

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      const classification = classifyError(
        event.reason instanceof Error ? event.reason : String(event.reason),
        'unhandledrejection'
      )

      if (!classification.shouldLog) {
        event.preventDefault() // Prevent logging to console
      }
    })

    // Handle global errors
    window.addEventListener('error', event => {
      const classification = classifyError(
        event.message,
        event.filename || 'global',
        event.error?.stack
      )

      if (!classification.shouldLog) {
        event.preventDefault() // Prevent logging to console
      }
    })
  }
}
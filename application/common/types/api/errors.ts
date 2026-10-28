/**
 * @example {
 *  "message": "Internal Server Error"
 * }
 */
export interface InternalErrorResponse {
  message: 'Internal Server Error'
}

/**
 * @example {
 *  "message": "Unprocessable Content",
 *  "details": "There was a problem"
 * }
 */
export interface UnprocessableErrorResponse {
  message: 'Unprocessable Content'
  details?: string
}

/**
 * @example {
 *  "message": "Unauthorized",
 *  "details": { "message": "Token not in headers" }
 * }
 */
export interface UnauthorizedErrorResponse {
  message: string
  details?: unknown
}

/**
 * @example {
 *  "message": "Validation Failed",
 *  "bodyRequest.firstName": {
 *    "message": "Invalid value provided",
 *   }
 * }
 */
export interface ValidateErrorResponse {
  message: 'Validation Failed'
  details: { [name: string]: unknown }
}

/**
 * @example {
 *  "message": "Email already exists",
 *  "code": "P2002",
 *  "details": "Email already exists"
 * }
 */
export interface PrismaErrorResponse {
  message: string
  code: string
  details?: string
}

/**
 * @example {
 *  "message": "Not Found",
 *  "details": { "message": "User not found" }
 * }
 */
export interface NotFoundErrorResponse {
  message: string
  details?: unknown
}

/**
 * @example {
 *  "message": "File upload failed",
 *  "details": "File too large"
 * }
 */
export interface BadRequestErrorResponse {
  message: string
  details?: unknown
}

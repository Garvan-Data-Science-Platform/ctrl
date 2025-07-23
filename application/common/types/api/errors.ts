/**
 * @example {
 *  "message": "Internal Server Error",
 *  "details": { "message": "Some error happened D:" }
 * }
 */
export interface InternalErrorResponse {
  message: 'Internal Server Error'
  details?: unknown
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
 *    "message": "minLength 1",
 *    "value": ""
 *   }
 * }
 */
export interface ValidateErrorResponse {
  message: 'Validation Failed'
  details: { [name: string]: unknown }
}

/**
 * @example {
 *  "message": "email already in use",
 *  "code": "P2002",
 *  "details": {
 *    "modelName": "User",
 *    "target": [
 *      "email"
 *    ]
 *  }
 * }
 */
export interface PrismaErrorResponse {
  message: string
  code: string
  details?: unknown
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
 *  "message": "Bad Request",
 *  "details": { "message": "File is of incorrect type" }
 * }
 */
export interface BadRequestErrorResponse {
  message: string
  details?: unknown
}

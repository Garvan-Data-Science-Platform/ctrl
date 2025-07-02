/**
 * @example {
 *  "name": "Acme Genomics Study",
 * }
 */
export interface CreateStudyRequest {
  /**
   * @minLength 1
   */
  name: string
}

export interface CreateStudyResponse {
  id: number
}

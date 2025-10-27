/**
 * @example {
 *  "name": "UpdatedStudyName",
 * }
 */
export interface UpdateStudyRequest {
  /**
   * @minLength 1
   */
  name?: string
  description?: string
  redcapToken?: string
  redcapURL?: string
}

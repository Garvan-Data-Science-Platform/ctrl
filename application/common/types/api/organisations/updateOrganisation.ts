/**
 * @example {
 *  "name": "UpdatedOrganisationName",
 * }
 */
export interface UpdateOrganisationRequest {
  /**
   * @minLength 1
   */
  name?: string
}

export interface UpdateOrganisationResponse {
  message: string
}

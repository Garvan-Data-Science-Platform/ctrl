/**
 * @example {
 *  "name": "ABC. Corp",
 * }
 */
export interface CreateOrganisationRequest {
  /**
   * @minLength 1
   */
  name: string
}

export interface CreateOrganisationResponse {
  message: string
  organisationID: number
}

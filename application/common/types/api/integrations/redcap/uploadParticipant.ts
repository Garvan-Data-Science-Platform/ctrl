/**
 * This is the name of the redcap instrument you are importing from.
 * NOTE: These 'forms' are not the form label values that are seen on the webpages,
 * but instead they are the unique form names seen in Column B of the data dictionary.
 */
export interface UploadRedcapParticipantAPIRequest {
  /**
   * @minLength 1
   */
  form: string // specify the form you want to accesss
}

export interface UploadRedcapParticipantResponse {
  profilesCreatedCount: number
  profilesAlreadyExistedCount: number
  ids: number[]
}

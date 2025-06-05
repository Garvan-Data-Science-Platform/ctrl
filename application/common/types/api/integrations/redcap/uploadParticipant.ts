export interface UploadRedcapParticipantResponse {
  profilesCreatedCount: number
  profilesAlreadyExistedCount: number
  ids: number[]
  newInvites: string[]
}

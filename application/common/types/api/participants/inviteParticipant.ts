/**
 * @pattern ^(.+)@(.+)$ Please provide valid email
 */
type Email = string

export interface InviteParticipantsRequest {
  emails: Email[]
}

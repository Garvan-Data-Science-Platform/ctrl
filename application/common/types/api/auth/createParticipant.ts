import { RegisterParticipantRequest } from './registerParticipant'

export type CreateParticipantRequest = Omit<
  RegisterParticipantRequest,
  'middleName' | 'email' | 'password'
>

export interface CreateParticipantResponse {
  message: string
}

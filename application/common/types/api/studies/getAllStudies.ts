import { Study } from '@prisma/client'

export interface GetAllStudiesResponse {
  data: (Omit<Study, 'logo' | 'redcapToken'> & { hasRedcapToken: boolean; logo: boolean })[]
}

export interface GetAllStudiesByParticipantResponse {
  data: Omit<Study, 'logo' | 'redcapURL' | 'redcapToken'>[]
}

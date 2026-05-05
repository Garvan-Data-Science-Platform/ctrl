import { Study } from '@prisma/client'

export type AdminStudyItem = Omit<Study, 'logo' | 'redcapToken'> & {
  hasRedcapToken: boolean
  logo: boolean
}

export type ParticipantStudyItem = Omit<Study, 'logo' | 'redcapURL' | 'redcapToken'>

export interface GetAllStudiesResponse {
  data: AdminStudyItem[]
}

export interface GetAllStudiesByParticipantResponse {
  data: ParticipantStudyItem[]
}

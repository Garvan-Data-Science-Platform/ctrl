import { Study } from '@prisma/client'

export interface GetStudyByIdResponse {
  data: Omit<Study, 'logo' | 'redcapToken'> & {
    hasRedcapToken: boolean
    logo: boolean
  }
}

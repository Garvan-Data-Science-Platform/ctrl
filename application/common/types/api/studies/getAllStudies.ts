import { Study } from '@prisma/client'

export interface GetAllStudiesResponse {
  data: (Omit<Study, 'logo' | 'redcapURL' | 'redcapToken'> & { logo: boolean })[]
}

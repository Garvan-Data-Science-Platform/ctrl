import { Organisation } from '@prisma/client'

export interface GetAllOrganisations {
  Response: {
    message: string
    organisations: Organisation[]
  }
}

import { Organisation } from '@prisma/client'

export interface GetOrganisationById {
  Response: {
    message: string
    organisation: Organisation | null
  }
}

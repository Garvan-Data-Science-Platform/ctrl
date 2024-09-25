import { Organisation } from '@prisma/client'

export interface DeleteOrganisation {
  Response: {
    message: string
    deletedOrganisation: Organisation | null
  }
}

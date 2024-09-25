import { Organisation } from '@prisma/client'

export interface CreateOrganisation {
  Request: {
    name: string
  }
  Response: {
    message: string
    newOrganisation: Organisation | null
  }
}

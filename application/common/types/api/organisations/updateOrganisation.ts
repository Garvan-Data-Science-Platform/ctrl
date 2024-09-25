import { Organisation } from '@prisma/client'

export interface UpdateOrganisation {
  Request: {
    name?: string
  }
  Response: {
    message: string
    updatedOrganisation: Organisation | null
  }
}

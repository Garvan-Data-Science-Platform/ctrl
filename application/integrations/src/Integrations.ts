import { mapToParticipantRequest } from './mapData'
import { RegisterParticipantRequest } from '../../common/types/api/auth'


export class Integrations {
  
  mapping: Record<string, string>
  // a series of methods for integrations
  constructor(mapping: Record<string, string>) {
    this.mapping = mapping
  }

  // record types
  mapCSVToParticipantRequests(csv: Record<string, string>[]): RegisterParticipantRequest[] {
    const res: RegisterParticipantRequest[] = []
    for (const userData of csv) {
      res.push(mapToParticipantRequest(userData, this.mapping))
    }

    return res
  }
}

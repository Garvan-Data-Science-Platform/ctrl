import { Url } from '../../commonTypes'

export interface GetSettingsResponse {
  data: {
    logoSet: string | null // TODO: add type?
    primaryColour: string | null // TODO: add type?
    secondaryColour: string | null
    tcLink: Url
    newsLink: Url | null
  }
}

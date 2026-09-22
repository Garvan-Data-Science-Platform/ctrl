import { Url } from '../../commonTypes'

export interface GetUserPortalSettingsResponse {
  data: {
    primaryColour: string | null
    secondaryColour: string | null
    newsLink: Url | null
  }
}

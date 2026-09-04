import { Url } from '../../commonTypes'

export interface GetUserPortalSettingsResponse {
  data: {
    primaryColour: string | null // TODO: add type?
    secondaryColour: string | null
    newsLink: Url | null
  }
}

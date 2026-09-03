import { Url } from '../../commonTypes'

export interface SettingsBase {
  primaryColour: string | null // TODO: add type?
  secondaryColour: string | null // TODO: add type?
  tcLink: Url
  newsLink: Url | null
}

// required tcLink and newsLink
export interface GetSettingsResponse {
  data: SettingsBase & {
    logoSet: string | null // TODO: add type?
  }
}

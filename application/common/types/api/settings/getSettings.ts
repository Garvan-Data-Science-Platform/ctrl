import { CssColour, Url } from '../../commonTypes'

export interface SettingsBase {
  primaryColour: CssColour | null
  secondaryColour: CssColour | null
  tcLink: Url
  newsLink: Url | null
}

// required tcLink and newsLink
export interface GetSettingsResponse {
  data: SettingsBase & {
    logoSet: string | null // TODO: add type?
  }
}

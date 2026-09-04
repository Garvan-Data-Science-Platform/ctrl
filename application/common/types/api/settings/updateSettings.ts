import { CssColour, Url } from '../../commonTypes'

export interface UpdateSettingsRequest {
  primaryColour?: CssColour | null
  secondaryColour?: CssColour | null
  tcLink?: Url
  newsLink?: Url
}

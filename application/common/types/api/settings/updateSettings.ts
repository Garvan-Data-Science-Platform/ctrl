import { Url } from '../../commonTypes'

export interface UpdateSettingsRequest {
  primaryColour?: string | null // TODO: add type?
  secondaryColour?: string | null // TODO: add type?
  tcLink?: Url
  newsLink?: Url
}

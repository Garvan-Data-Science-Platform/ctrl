export interface GetSettingsResponse {
  data: {
    mailerHost: string | null
    mailerPort: number | null
    mailerUser: string | null
    mailerPassword: string | null
    primaryColour: string | null
    secondaryColour: string | null
    redcapToken: string | null
    redcapURL: string | null
  }
}

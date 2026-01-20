export interface GetSettingsResponse {
  data: {
    logoSet: string | null
    primaryColour: string | null
    secondaryColour: string | null
    tcLink: string
    newsLink: string | null
  }
}

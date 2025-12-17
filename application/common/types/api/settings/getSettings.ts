export interface GetSettingsResponse {
  data: {
    logo: string | null
    primaryColour: string | null
    secondaryColour: string | null
    tcLink: string
    newsLink: string | null
  }
}

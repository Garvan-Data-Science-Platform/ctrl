import { GetSettingsResponse } from './getSettings'
type SettingsData = GetSettingsResponse['data']
export type UpdateSettingsRequest = Partial<Omit<SettingsData, 'logoSet'>>

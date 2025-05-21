import { GetSettingsResponse } from './getSettings'
export type UpdateSettingsRequest = Partial<GetSettingsResponse['data']>

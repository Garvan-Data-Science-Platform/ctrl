import { GetSettingsResponse } from './getSettings'
export interface UpdateSettingsRequest extends Partial<GetSettingsResponse['data']> {}

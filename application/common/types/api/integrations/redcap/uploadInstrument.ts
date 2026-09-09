import { RedcapFormName } from '../../../commonTypes'

export interface UploadRedcapInstrumentAPIRequest {
  formName: RedcapFormName
}

export interface UploadRedcapInstrumentResponse {
  id: number
  versionNumber: number
}

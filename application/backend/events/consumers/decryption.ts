import { configureKeys } from 'prisma-field-encryption/dist/encryption'
import { decryptStringSync, findKeyForMessage } from '@47ng/cloak'
import type { CtrlEvent } from '../../prisma/events/event.type'

export const keys = configureKeys({})

export function decryptPayload(fieldsArray: any): CtrlEvent {
  const fieldsObj = fieldsArrayToObject(fieldsArray)
  const key = findKeyForMessage(fieldsObj.payload, keys.keychain)
  const payload = decryptStringSync(fieldsObj.payload, key)

  return {
    eventType: fieldsObj['eventType'] as CtrlEvent['eventType'],
    payload: JSON.parse(payload),
  }
}

function fieldsArrayToObject(fields: string[]) {
  const obj: Record<string, string> = {}
  for (let i = 0; i < fields.length; i += 2) {
    obj[fields[i]] = fields[i + 1]
  }
  return obj
}

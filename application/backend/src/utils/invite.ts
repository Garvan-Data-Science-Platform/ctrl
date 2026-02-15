import config from '../config'
import { v4 as uuidv4 } from 'uuid'

export function generateInviteId(): string {
  return uuidv4()
}

export function inviteExpiresAt(daysFromNow: number = config.inviteExpiryDays || 7): Date {
  return new Date(new Date().getTime() + daysFromNow * 24 * 60 * 60 * 1000)
}

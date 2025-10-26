import config from '../config'
import { v4 as uuidv4 } from 'uuid'

const INVITE_EXPIRY_DAYS = config.inviteExpiryDays || 7

export function generateInviteId(): string {
  return uuidv4()
}

export function inviteExpiresAt(daysFromNow: number = INVITE_EXPIRY_DAYS): Date {
  return new Date(new Date().getTime() + daysFromNow * 24 * 60 * 60 * 1000)
}

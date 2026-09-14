import config from '../config'
import { InviteStatus } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

export function generateInviteId(): string {
  return uuidv4()
}

export function inviteExpiresAt(daysFromNow: number = config.inviteExpiryDays || 7): Date {
  return new Date(new Date().getTime() + daysFromNow * 24 * 60 * 60 * 1000)
}

// Statuses where the invite row is still "in flight": recipients can register or accept
// against it, and admin bulk-resend picks it up. Split back into distinct constants if
// a future need diverges (e.g. adding EXPIRED to one of the two flows only).
export const ACTIVE_INVITE_STATUSES: InviteStatus[] = [InviteStatus.PENDING, InviteStatus.QUEUED]

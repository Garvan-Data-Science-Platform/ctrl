import config from '../config'
import { InviteStatus } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

export function generateInviteId(): string {
  return uuidv4()
}

export function inviteExpiresAt(daysFromNow: number = config.inviteExpiryDays || 7): Date {
  return new Date(new Date().getTime() + daysFromNow * 24 * 60 * 60 * 1000)
}

// Statuses a recipient can register/accept against. QUEUED means the row is written but
// the drain has not yet sent (or has not yet flipped to PENDING) — the invite is still
// valid, so recipients who click the link mid-drain must be able to proceed.
export const REGISTERABLE_INVITE_STATUSES: InviteStatus[] = [
  InviteStatus.PENDING,
  InviteStatus.QUEUED,
]

// Statuses the bulk "Resend all pending" endpoint should pick up. QUEUED is included so
// that rows stranded by a pod restart mid-drain are recoverable by the same bulk button
// admins already use — otherwise the recovery path is N per-invite clicks instead of one.
// Kept separate from REGISTERABLE_INVITE_STATUSES because it answers a different question:
// resendability may diverge from registerability in future without either constant changing.
export const RESENDABLE_INVITE_STATUSES: InviteStatus[] = [
  InviteStatus.PENDING,
  InviteStatus.QUEUED,
]

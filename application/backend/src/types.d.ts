// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as express from 'express'
import type { OIDCAuditMeta } from 'common/types/oidc'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number
      }
    }
    interface Locals {
      // See getAuditDetails in middlewares/AuditLog.ts
      audit?: {
        userId?: number
        meta?: { oidc?: OIDCAuditMeta }
      }
    }
  }
}

import { AuditLogOperation } from '@prisma/client'
import { Request, Response, NextFunction } from 'express'
import prisma from '../PrismaClient'

// SENSITIVE FIELDS THAT WE DO NOT WANT TO SHOW IN AUDIT LOG
const SENSITIVE_FIELDS = [
  'password',
  'redcapToken',
  'otp_code',
  'otp_token',
  'token',
  'newPassword',
  'code', // the one-time OIDC authorization code
]

// Lets a route add its user and details to its own audit log row, e.g. the login routes, which
// have no login token yet
export function getAuditDetails(req: Request): NonNullable<Express.Locals['audit']> {
  // Express always sets req.res. The check is only there because its type is optional.
  if (!req.res) return {}
  req.res.locals.audit ??= {}
  return req.res.locals.audit
}

export async function auditLog(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId || undefined

  if (!['PATCH', 'DELETE', 'POST', 'PUT'].includes(req.method)) {
    next()
    return
  }

  res.on('finish', async () => {
    let operation: AuditLogOperation

    switch (req.method) {
      case 'PATCH':
        operation = 'UPDATE'
        break
      case 'DELETE':
        operation = 'DELETE'
        break
      case 'POST':
        operation = 'CREATE'
        break
      case 'PUT':
        operation = 'CREATE'
        break
      default:
        console.log(req.method)
        throw Error('Bad method')
    }

    const num = req.url.split('/').filter((val) => /^-?\d+$/.test(val || ''))

    const id = req.url.split('/').includes('current') ? 'current' : num.join(',')

    const resource = req.url
      .split('/')
      .filter((val) => !/^-?\d+$/.test(val || '') && val !== 'current' && val)
      .join('/')
    const success = 200 <= res.statusCode && res.statusCode <= 299

    const bodyData = req.body ? structuredClone(req.body) : undefined

    if (bodyData) {
      SENSITIVE_FIELDS.forEach((field) => {
        if (bodyData[field] !== undefined) {
          bodyData[field] = '***'
        }
      })
    }
    const meta = { resourceId: id, url: req.url, method: req.method, ...res.locals.audit?.meta }

    try {
      await prisma.auditLog.create({
        data: {
          userId: res.locals.audit?.userId ?? userId,
          operation,
          resource,
          meta,
          requestBody: bodyData ? JSON.stringify(bodyData) : undefined,
          success,
        },
      })
    } catch (e) {
      console.log('Audit log error', e)
    }
  })

  next()
}

import { AuditLogOperation } from '@prisma/client'
import { Request, Response, NextFunction } from 'express'
import prisma from '../PrismaClient'

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
    const bodyData = req.body
    if (bodyData?.password) {
      bodyData.password = '***'
    }
    const meta = { resourceId: id, url: req.url, method: req.method }

    try {
      await prisma.auditLog.create({
        data: {
          userId: userId,
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

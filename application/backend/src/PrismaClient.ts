import './jsontypes'
import { PrismaClient } from '@prisma/client'
import { fieldEncryptionExtension } from 'prisma-field-encryption'

const baseClient = new PrismaClient()

/***********************************/
/* SOFT DELETE MIDDLEWARE */
/***********************************/

baseClient.$use(async (params, next) => {
  if (params.model == 'User' || params.model == 'Study' || params.model == 'StudyParticipant') {
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      // Change to findFirst - you cannot filter
      // by anything except ID / unique with findUnique()
      params.action = 'findFirst'
      // Add 'deleted' filter
      // ID filter maintained
      if (params.args.where.deleted == undefined) {
        // Exclude deleted records if they have not been explicitly requested
        params.args.where['deleted'] = false
      }
    }
    if (params.action === 'findFirstOrThrow' || params.action === 'findUniqueOrThrow') {
      if (params.args.where) {
        if (params.args.where.deleted == undefined) {
          // Exclude deleted records if they have not been explicitly requested
          params.args.where['deleted'] = false
        }
      } else {
        params.args.where = { deleted: false }
      }
    }
    if (params.action === 'findMany') {
      // Find many queries
      if (params.args.where) {
        if (params.args.where.deleted == undefined) {
          params.args.where['deleted'] = false
        }
      } else {
        params.args.where = { deleted: false }
      }
    }
    if (params.action === 'count') {
      if (!params.args) {
        params.args = { where: { deleted: false } }
      } else if (!params.args.where) {
        params.args.where = { deleted: false }
      } else if (params.args.where.deleted == undefined) {
        params.args.where['deleted'] = false
      }
    }
    if (params.action == 'update') {
      if (params.args.where.deleted == undefined) {
        params.args.where['deleted'] = false
      }
    }
    if (params.action == 'updateMany') {
      if (params.args.where != undefined) {
        params.args.where['deleted'] = false
      }
    }
    if (params.action == 'delete') {
      // Delete queries
      // Change action to an update
      params.action = 'update'
      params.args['data'] = { deleted: true }
    }
    if (params.action == 'deleteMany') {
      // Delete many queries
      params.action = 'updateMany'
      if (params.args.data != undefined) {
        params.args.data['deleted'] = true
      } else {
        params.args['data'] = { deleted: true }
      }
    }
  }
  return next(params)
})

const prisma = baseClient.$extends(fieldEncryptionExtension())

export default prisma

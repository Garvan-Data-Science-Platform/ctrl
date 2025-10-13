import { Prisma } from '@prisma/client'

/**
 * Extracts filter from queryParams and returns a Prisma-compatible 'where' object for the given model.
 * Only supports a single filter in the format filter[field][operator]=value.
 */

type FilterKey = keyof Prisma.StringFilter | keyof Prisma.DateTimeFilter

const operatorMap: Record<
  string,
  FilterKey | ['not', FilterKey] | ['equals', any] | ['notequals', any]
> = {
  eq: 'equals',
  doesNotEqual: 'not',
  lt: 'lt',
  lte: 'lte',
  gt: 'gt',
  gte: 'gte',
  contains: 'contains',
  doesNotContain: ['not', 'contains'],
  startsWith: 'startsWith',
  endsWith: 'endsWith',
  in: 'in',
  null: ['equals', null],
  nnull: ['notequals', null],
  ne: 'not', // Date not
}

export function extractWhere(queryParams: { [key: string]: any }) {
  for (const key of Object.keys(queryParams)) {
    const match = key.match(/^filter\[(.+)\]\[(.+)\]$/)
    if (match) {
      const [, field, operator] = match
      const prismaOperator = operatorMap[operator]
      if (!prismaOperator) continue
      if (Array.isArray(prismaOperator)) {
        const [outerOp, innerOpOrValue] = prismaOperator

        if (innerOpOrValue === null) {
          return {
            [field]: {
              [outerOp]: null,
            },
          }
        } else if (outerOp === 'not' && typeof innerOpOrValue === 'string') {
          return {
            [field]: {
              not: {
                [innerOpOrValue]: queryParams[key],
              },
            },
          }
        } else if (outerOp === 'equals') {
          return {
            [field]: {
              equals: innerOpOrValue,
            },
          }
        }
      } else {
        return {
          [field]: {
            [prismaOperator]: queryParams[key],
          },
        }
      }
    }
  }
  return undefined
}

export function extractOrderBy(queryParams: { [key: string]: any }) {
  for (const key of Object.keys(queryParams)) {
    const match = key.match(/^orderBy\[(.+)\]$/)
    if (match) {
      const [, field] = match
      const direction = queryParams[key]
      if (direction === 'asc' || direction === 'desc') {
        return {
          [field]: direction,
        }
      }
    }
  }
  return undefined
}

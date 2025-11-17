/**
 * Extracts filter from queryParams and returns a Prisma-compatible 'where' object for the given model.
 * Only supports a single filter in the format filter[field][operator]=value.
 */

const arrayOperatorMap: Record<string, (fieldValue: any, filterValue: any) => boolean> = {
  eq: (a, b) => a === b,
  doesNotEqual: (a, b) => a !== b,
  lt: (a, b) => a < b,
  lte: (a, b) => a <= b,
  gt: (a, b) => a > b,
  gte: (a, b) => a >= b,
  contains: (a, b) => typeof a === 'string' && a.includes(b),
  doesNotContain: (a, b) => typeof a === 'string' && !a.includes(b),
  startswith: (a, b) => typeof a === 'string' && a.startsWith(b),
  endswith: (a, b) => typeof a === 'string' && a.endsWith(b),
  in: (a, b) => String(b).split(',').includes(a),
  null: (a) => a === null || a === '' || a === undefined,
  nnull: (a) => !(a === null || a === '' || a === undefined),
  ne: (a, b) => a !== b,
}

function toLowerIfString(val: any) {
  return typeof val === 'string' ? val.toLowerCase() : val
}

export function extractFilter(queryParams: { [key: string]: any }) {
  for (const key of Object.keys(queryParams)) {
    const match = key.match(/^filter\[(.+)\]\[(.+)\]$/)
    if (match) {
      const [, field, operator] = match
      const opFn = arrayOperatorMap[operator as keyof typeof arrayOperatorMap]
      if (!opFn) continue
      const filterValue = queryParams[key]
      return {
        field,
        filterFunction: (item: any) => opFn(toLowerIfString(item), toLowerIfString(filterValue)),
      }
    }
  }
  return undefined
}

/*
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
  */

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

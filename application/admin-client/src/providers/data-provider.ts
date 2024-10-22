import type { DataProvider } from '@refinedev/core'

const API_URL = 'https://api.fake-rest.refine.dev'

export const dataProvider: DataProvider = {
  getOne: () => {
    throw new Error('Not implemented')
  },
  update: () => {
    throw new Error('Not implemented')
  },
  getList: () => {
    throw new Error('Not implemented')
  },
  create: () => {
    throw new Error('Not implemented')
  },
  deleteOne: () => {
    throw new Error('Not implemented')
  },
  getApiUrl: () => API_URL,
  // Optional methods:
  // getMany: () => { /* ... */ },
  // createMany: () => { /* ... */ },
  // deleteMany: () => { /* ... */ },
  // updateMany: () => { /* ... */ },
  // custom: () => { /* ... */ },
}

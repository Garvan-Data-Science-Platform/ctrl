import type { DataProvider } from '@refinedev/core'
import axios from 'axios'
import { TOKEN_KEY } from './authProvider'

export const axiosInstance = axios.create()

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token && config?.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export const dataProvider = (url: string): DataProvider => ({
  getOne: async ({ resource, id }) => {
    const response = await axiosInstance.get(`${url}/${resource}/${id}`)
    const data = response.data.data
    return {
      data,
    }
  },
  update: async ({ resource, id, variables }) => {
    const response = await axiosInstance.patch(`${url}/${resource}/${id}`, variables)
    const data = response.data
    return {
      data,
    }
  },
  getList: async ({ resource }) => {
    const response = await axiosInstance.get(`${url}/${resource}`)
    const data = response.data.data
    return {
      data,
      total: data.length,
    }
  },
  create: async ({ resource, variables }) => {
    const response = await axiosInstance.post(`${url}/${resource}`, variables)
    const data = response.data
    return {
      data,
    }
  },
  deleteOne: async ({ resource, id }) => {
    const response = await axiosInstance.delete(`${url}/${resource}/${id}`)
    const data = response.data
    return {
      data,
    }
  },
  getApiUrl: () => url,
  // Optional methods:
  // getMany: () => { /* ... */ },
  // createMany: () => { /* ... */ },
  // deleteMany: () => { /* ... */ },
  // updateMany: () => { /* ... */ },
  // custom: () => { /* ... */ },
})

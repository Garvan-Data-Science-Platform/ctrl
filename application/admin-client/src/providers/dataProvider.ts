import type { DataProvider } from '@refinedev/core'
import axios from 'axios'
import { TOKEN_KEY } from './authProvider'
import { useStudyStore } from '../studyStore'

const API_URL = import.meta.env.VITE_BACKEND_URL
export const axiosInstance = axios.create({ baseURL: API_URL })

const studyResources = [
  'surveys',
  'surveys/responses/all',
  'surveys/responses',
  'invites',
  'participants',
  'families',
]

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

// Add response interceptor for 401 redirect
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.href = '/login'
    }
    error.message = error?.response?.data?.details || error.message
    return Promise.reject(error)
  },
)

export const dataProvider = (): DataProvider => {
  return {
    getOne: async ({ resource, id }) => {
      const { studies, activeStudyIndex } = useStudyStore.getState()
      const studyId = studies[activeStudyIndex].id
      let url = `${resource}/${id}`
      if (studyResources.includes(resource)) url = `/studies/${studyId}/${url}`
      const response = await axiosInstance.get(url)
      const data = response.data.data
      return {
        data,
      }
    },
    update: async ({ resource, id, variables }) => {
      const { studies, activeStudyIndex } = useStudyStore.getState()
      const studyId = studies[activeStudyIndex].id
      let url = `${resource}/${id}`
      if (studyResources.includes(resource)) url = `/studies/${studyId}/${url}`
      const response = await axiosInstance.patch(url, variables)
      const data = response.data
      return {
        data,
      }
    },
    getList: async ({ resource, pagination, filters, sorters }: any) => {
      const { studies, activeStudyIndex } = useStudyStore.getState()
      const studyId = studies[activeStudyIndex].id
      let url = resource
      const params = new URLSearchParams()
      if (pagination) {
        params.append(
          '_start',
          String(((pagination.current || 1) - 1) * (pagination.pageSize || 1)),
        )
        params.append('_end', String((pagination.current || 1) * (pagination.pageSize || 1)))
      }

      if (filters?.at(0)) {
        params.append(`filter[${filters[0].field}][${filters[0].operator}]`, filters[0].value)
      }

      if (sorters?.at(0)) {
        params.append(`orderBy[${sorters[0].field}]`, sorters[0].order)
      }

      if (studyResources.includes(resource)) url = `/studies/${studyId}/${url}?${params.toString()}`
      const response = await axiosInstance.get(url)
      const data = response.data.data

      return {
        data,
        total: response.data.total || data.length,
      }
    },
    create: async ({ resource, variables }) => {
      const response = await axiosInstance.post(`${resource}`, variables)
      const data = response.data
      return {
        data,
      }
    },
    deleteOne: async ({ resource, id }) => {
      const { studies, activeStudyIndex } = useStudyStore.getState()
      const studyId = studies[activeStudyIndex].id
      let url = `${resource}/${id}`
      if (studyResources.includes(resource)) url = `/studies/${studyId}/${url}`
      const response = await axiosInstance.delete(url)
      const data = response.data
      return {
        data,
      }
    },
    custom: async ({ url }) => {
      const response = await axiosInstance.get(url)
      const data = response.data
      return {
        data,
      }
    },
    getApiUrl: () => API_URL,
    // Optional methods:
    // getMany: () => { /* ... */ },
    // createMany: () => { /* ... */ },
    // deleteMany: () => { /* ... */ },
    // updateMany: () => { /* ... */ },
    // custom: () => { /* ... */ },
  }
}

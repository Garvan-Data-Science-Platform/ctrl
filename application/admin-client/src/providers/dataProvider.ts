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
    getList: async ({ resource }) => {
      const { studies, activeStudyIndex } = useStudyStore.getState()
      const studyId = studies[activeStudyIndex].id
      let url = resource
      if (studyResources.includes(resource)) url = `/studies/${studyId}/${url}`
      const response = await axiosInstance.get(url)
      const data = response.data.data
      return {
        data,
        total: data.length,
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
      const response = await axiosInstance.delete(`${resource}/${id}`)
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

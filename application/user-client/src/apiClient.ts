import axios from 'axios'

export const apiClient = axios.create({ baseURL: import.meta.env.VITE_BACKEND_URL })

apiClient.interceptors.response.use(
  (res) => {
    return res
  },
  (err) => {
    if (err.status == 401) {
      location.replace('/login')
    }
    return err
  },
)

apiClient.interceptors.request.use((res) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    res.headers['Authorization'] = `Bearer ${token}`
  }
  return res
})

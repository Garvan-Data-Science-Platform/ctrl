// eslint-disable-next-line no-restricted-imports
import { useLogin as refinedUseLogin } from '@refinedev/core'
import { LoginParams } from '../providers/authProvider'

export const useLogin = () => {
  return refinedUseLogin<LoginParams>()
}

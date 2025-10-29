import { create } from 'zustand'
import { produce } from 'immer'
import { OIDCProvider } from '@common/types/oidc'

interface AuthState {
  providers: OIDCProvider[]
  setProviders: (providers: OIDCProvider[]) => void
  passwordLoginDisabled: boolean
  setPasswordLoginDisabled: (val: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  providers: [],
  passwordLoginDisabled: true,
  setPasswordLoginDisabled: (val: boolean) =>
    set(
      produce((state) => {
        state.passwordLoginDisabled = val
      }),
    ),
  setProviders: (providers: OIDCProvider[]) =>
    set(
      produce((state) => {
        state.providers = providers
      }),
    ),
}))

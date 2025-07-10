import { create } from 'zustand'
import { produce } from 'immer'

export interface OIDCProvider {
  name: string
  host: string
  clientId: string
  icon: string
}

interface OIDCProvidersState {
  providers: OIDCProvider[]
  setProviders: (providers: OIDCProvider[]) => void
}

export const useOIDCProviderStore = create<OIDCProvidersState>((set) => ({
  providers: [],

  setProviders: (providers: OIDCProvider[]) =>
    set(
      produce((state) => {
        state.providers = providers
      }),
    ),
}))

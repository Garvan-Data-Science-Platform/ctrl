import { ROLE_KEY } from './authProvider'

export const accessControlProvider = {
  can: async ({ resource, action }: any) => {
    // Get user role from localStorage, context, or API
    const role = localStorage.getItem(ROLE_KEY)
    if (resource === 'settings' && action === 'list') {
      return {
        can: role === 'OrganisationAdmin',
        reason: role !== 'OrganisationAdmin' ? 'Not allowed' : undefined,
      }
    }
    // Default: allow
    return { can: true }
  },
}

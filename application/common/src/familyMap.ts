import { ParticipantType } from '../types/api/users/ParticipantProfile'

export const familyMap: { [key in ParticipantType]: string } = {
  STANDARD: 'Family Member',
  DEPENDENT_AGE: 'Dependent child',
  DEPENDENT_OTHER: 'Dependent (permanent)',
  GUARDIAN: 'Co-parent / guardian',
}

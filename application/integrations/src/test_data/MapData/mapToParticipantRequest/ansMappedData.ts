import {
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from 'common/types/api/users/ParticipantProfile'

export const expectedMappedData = {
  externalId: 'external-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  mobile: '1234567890',
  preferredContact: Object.values(ContactMethod)[1], // assuming '1' maps to a valid ContactMethod
  addressLine: '123 Main St',
  suburb: 'Somewhere',
  postcode: '12345',
  state: Object.values(StateTerritory)[1], // assuming '1' maps to a valid StateTerritory
  password: 'temporaryPassword123',
  dob: '01/01/1990',
  participantType: ParticipantType.STANDARD,
  nextOfKin: {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    mobile: '0987654321',
  },
  dependents: [
    {
      firstName: 'test',
      lastName: 'child',
      dob: '1990-01-01',
      permanent: false,
    },
  ],
}

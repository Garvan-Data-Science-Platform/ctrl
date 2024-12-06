import { mapToParticipantRequest } from './mapData';
import { Integrations } from './Integrations'
import testMapping from './test_data/testMapping.json'
import exampleREDCapProfile from './test_data/exampleREDCapProfile.json'
import exampleMultipleProfiles from './test_data/exampleMultipleProfiles.json'
import { ContactMethod, ParticipantType, StateTerritory } from '../../common/types/api/users/ParticipantProfile';

describe('mapToParticipantRequest', () => {
  // Test case for normal mapping
  it('should map source data to RegisterParticipantRequest', () => {
    const sourceData = {
      ctrl_pers_name: 'John',
      ctrl_pers_surname: 'Doe',
      ctrl_email: 'john.doe@example.com',
      ctrl_phone_no: '1234567890',
      ctrl_pref_contact_meth: '1', // assuming '1' maps to a valid ContactMethod
      ctrl_address: '123 Main St',
      ctrl_suburb: 'Somewhere',
      ctrl_postcode: '12345',
      ctrl_state: '1', // assuming '1' maps to a valid StateTerritory
      ctrl_dob: '1990-01-01',
      ctrl_kin_name: 'Jane',
      ctrl_kin_surname: 'Doe',
      ctrl_kin_email: 'jane.doe@example.com',
      ctrl_kin_contactno: '0987654321'
    };

    const expectedMappedData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      mobile: '1234567890',
      preferredContact: Object.values(ContactMethod)[1], // assuming '1' maps to a valid ContactMethod
      addressLine: '123 Main St',
      suburb: 'Somewhere',
      postcode: '12345',
      state: Object.values(StateTerritory)[1], // assuming '1' maps to a valid StateTerritory
      password: 'temporary_password',
      dob: '1990-01-01',
      participantType: ParticipantType.STANDARD,
      nextOfKin: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        mobile: '0987654321'
      }
    };

    const result = mapToParticipantRequest(sourceData, testMapping);

    expect(result).toEqual(expectedMappedData);
  });

  // Test case for missing required fields (should throw error)
  it('should throw an error when a required field is missing', () => {
    const sourceData = {
      ctrl_pers_name: 'John',
      ctrl_pers_surname: 'Doe',
      ctrl_email: 'john.doe@example.com',
      ctrl_phone_no: '1234567890',
      ctrl_pref_contact_meth: '1', // assuming '1' maps to a valid ContactMethod
      ctrl_address: '123 Main St',
      ctrl_suburb: 'Somewhere',
      ctrl_postcode: '12345',
      ctrl_state: '1', // assuming '1' maps to a valid StateTerritory
      ctrl_kin_name: 'Jane',
      ctrl_kin_surname: 'Doe',
      ctrl_kin_email: 'jane.doe@example.com',
      ctrl_kin_contactno: '0987654321'
    }; // missing DOB

    expect(() => mapToParticipantRequest(sourceData, testMapping)).toThrow('Missing required field: dob');
  });

  // Test case for missing optional fields (no error thrown)
  it('should not throw an error for missing optional fields', () => {
    const sourceData = {
      ctrl_pers_name: 'John',
      ctrl_pers_surname: 'Doe',
      ctrl_email: 'john.doe@example.com',
      ctrl_phone_no: '1234567890',
      ctrl_pref_contact_meth: '1', // assuming '1' maps to a valid ContactMethod
      ctrl_address: '123 Main St',
      ctrl_suburb: 'Somewhere',
      ctrl_postcode: '12345',
      ctrl_state: '1', // assuming '1' maps to a valid StateTerritory
      ctrl_dob: '1990-01-01',
      ctrl_kin_name: 'Jane',
      ctrl_kin_surname: 'Doe',
      ctrl_kin_email: 'jane.doe@example.com',
      //missing next of kin mobile
    };

    const result = mapToParticipantRequest(sourceData, testMapping);

    expect(result.nextOfKin.mobile).toBeUndefined();  // No mobile for next of kin, should be undefined
  });


  describe('mapCSVToParticipantRequest', () => {
    it('registers one user correctly', () => {
        const int = new Integrations(testMapping)

        const res = int.mapCSVToParticipantRequests(exampleREDCapProfile)

        expect(res).toEqual([{
            "addressLine": "2 fake st", 
            "dob": "1984-01-10", 
            "email": "example@example.com", 
            "firstName": "John", 
            "lastName": "Smith", 
            "mobile": "0448434946", 
            "nextOfKin": {"email": "example2@example.com", "firstName": "fake", "lastName": "fakerson", "mobile": "0448434946"}, 
            "participantType": "STANDARD", 
            "password": "temporary_password", 
            "postcode": "2010", 
            "preferredContact": "MOBILE", 
            "state": "ACT", 
            "suburb": "fakie"
        }])
    })

    it('registers multiple users correctly', () => {
        const int = new Integrations(testMapping)

        const res = int.mapCSVToParticipantRequests(exampleMultipleProfiles)

        expect(res).toEqual([
            {
                "addressLine": "2 fake st", 
                "dob": "1984-01-10", 
                "email": "example@example.com", 
                "firstName": "John", 
                "lastName": "Smith", 
                "mobile": "0448434946", 
                "nextOfKin": {"email": "example2@example.com", "firstName": "fake", "lastName": "fakerson", "mobile": "0448434946"}, 
                "participantType": "STANDARD", 
                "password": "temporary_password", 
                "postcode": "2010", 
                "preferredContact": "MOBILE", 
                "state": "ACT", 
                "suburb": "fakie"
            },
            {
                "addressLine": "2 fake st", 
                "dob": "1984-01-10", 
                "email": "example@example.com", 
                "firstName": "Test", 
                "lastName": "Testerson", 
                "mobile": "0448434946", 
                "nextOfKin": {"email": "example2@example.com", "firstName": "fake", "lastName": "fakerson", "mobile": "0448434946"}, 
                "participantType": "STANDARD", 
                "password": "temporary_password", 
                "postcode": "2010", 
                "preferredContact": "MOBILE", 
                "state": "ACT", 
                "suburb": "fakie"
            },
            {
                "addressLine": "2 fake st", 
                "dob": "1984-01-10", 
                "email": "example@example.com", 
                "firstName": "Fake", 
                "lastName": "Guy", 
                "mobile": "0448434946", 
                "nextOfKin": {"email": "example2@example.com", "firstName": "fake", "lastName": "fakerson", "mobile": "0448434946"}, 
                "participantType": "STANDARD", 
                "password": "temporary_password", 
                "postcode": "2010", 
                "preferredContact": "MOBILE", 
                "state": "ACT", 
                "suburb": "fakie"
            }
        ])
    })
  });
});
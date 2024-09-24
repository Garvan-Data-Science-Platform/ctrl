import { OrganisationsController } from './OrganisationsController'
import { PrismaClientMock } from '../PrismaClientMock'
import { OrganisationCreationRequest, OrganisationUpdateRequest } from 'common/src/Organisation'
import { Prisma } from '@prisma/client'

const exampleOrg1 = {
  id: 1,
  name: 'Test Org 1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const exampleOrg2 = {
  id: 2,
  name: 'Test Org 2',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('OrganisationsController', () => {
  let orgController: OrganisationsController

  beforeEach(() => {
    orgController = new OrganisationsController()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllOrganisations', () => {
    it('should return an empty list of organisations if the database is empty', async () => {
      PrismaClientMock.organisation.findMany.mockResolvedValueOnce([])

      const expectedResult = { message: 'Got all organisations', organisations: [] }

      await expect(orgController.getAllOrganisations()).resolves.toEqual(expectedResult)
    })

    it('should return an empty list of organisations if the database', async () => {
      PrismaClientMock.organisation.findMany.mockResolvedValueOnce([exampleOrg1, exampleOrg2])

      const expectedResult = {
        message: 'Got all organisations',
        organisations: [exampleOrg1, exampleOrg2],
      }

      await expect(orgController.getAllOrganisations()).resolves.toEqual(expectedResult)
    })
  })

  describe('getOrganisationById', () => {
    it('should return an organisation if the organisation exists', async () => {
      PrismaClientMock.organisation.findUnique.mockResolvedValueOnce(exampleOrg1)

      const orgID = 1

      const expectedResult = {
        message: `Get organisation with ID: ${orgID}`,
        organisation: exampleOrg1,
      }

      await expect(orgController.getOrganisationById(orgID)).resolves.toEqual(expectedResult)
    })

    it('should return null if the organisation does not exist', async () => {
      PrismaClientMock.organisation.findUnique.mockResolvedValueOnce(null)
      const orgID = 1

      const expectedResult = {
        message: `Organisation with ID: ${orgID} not found`,
        organisation: null,
      }

      await expect(orgController.getOrganisationById(orgID)).resolves.toEqual(expectedResult)
    })
  })

  describe('createOrganisation', () => {
    it('should create a new organisation with the correct details', async () => {
      PrismaClientMock.organisation.create.mockResolvedValueOnce(exampleOrg1)

      const bodyRequest: OrganisationCreationRequest = {
        name: exampleOrg1.name,
      }

      const expectedResult = {
        message: 'Created new organisation',
        newOrganisation: exampleOrg1,
      }

      await expect(orgController.createOrganisation(bodyRequest)).resolves.toEqual(expectedResult)
    })

    it('should return null if the organisation creation fails', async () => {
      PrismaClientMock.organisation.create.mockRejectedValueOnce(
        new Error('Error creating organisation'),
      )

      const bodyRequest: OrganisationCreationRequest = {
        name: exampleOrg1.name,
      }

      const expectedResult = {
        message: 'Error creating organisation',
        newOrganisation: null,
      }

      await expect(orgController.createOrganisation(bodyRequest)).resolves.toEqual(expectedResult)
    })
  })

  describe('updateOrganisation', () => {
    it('should update an existing organisation if the organisation exists and return the updated organisation', async () => {
      PrismaClientMock.organisation.update.mockResolvedValueOnce(exampleOrg1)

      const orgID = 1
      const bodyRequest: OrganisationUpdateRequest = {
        name: exampleOrg1.name,
      }

      const expectedResult = {
        message: `Updated organisation with ID: ${orgID}`,
        updatedOrganisation: exampleOrg1,
      }

      await expect(orgController.updateOrganisation(orgID, bodyRequest)).resolves.toEqual(
        expectedResult,
      )
    })

    it('should return null if the organisation does not exist', async () => {
      PrismaClientMock.organisation.update.mockRejectedValueOnce(
        new Prisma.PrismaClientInitializationError(
          'Data not found in db',
          'someClientVersion',
          'P2025',
        ),
      )
      const orgID = 1
      const bodyRequest: OrganisationUpdateRequest = {
        name: exampleOrg1.name,
      }

      const expectedResult = {
        message: 'Error updating organisation',
        updatedOrganisation: null,
      }

      await expect(orgController.updateOrganisation(orgID, bodyRequest)).resolves.toEqual(
        expectedResult,
      )
    })
  })
  describe('deleteOrganisation', () => {
    it('should delete an existing organisation if the organisation exists and return the deleted organisation', async () => {
      PrismaClientMock.organisation.delete.mockResolvedValueOnce(exampleOrg1)

      const orgID = 1

      const expectedResult = {
        message: `Deleted organisation with ID: ${orgID}`,
        deletedOrganisation: exampleOrg1,
      }

      await expect(orgController.deleteOrganisation(orgID)).resolves.toEqual(expectedResult)
    })

    it('should return null if the organisation does not exist', async () => {
      PrismaClientMock.organisation.delete.mockRejectedValueOnce(
        new Prisma.PrismaClientInitializationError(
          'Data not found in db',
          'someClientVersion',
          'P2025',
        ),
      )
      const orgID = 1

      const expectedResult = {
        message: 'Error deleting organisation',
        deletedOrganisation: null,
      }
      await expect(orgController.deleteOrganisation(orgID)).resolves.toEqual(expectedResult)
    })
  })

  describe('getOrganisationUsers', () => {
    it('should return a message indicating the organisation does not exist if there is no matching organisation', async () => {
      PrismaClientMock.organisation.findUnique.mockResolvedValueOnce(null)
      const orgID = 1

      const expectedResult = {
        message: `Organisation with ID: ${orgID} not found`,
        users: null,
      }

      await expect(orgController.getOrganisationUsers(orgID)).resolves.toEqual(expectedResult)
    })

    it('should return a list of all users in the organisation', async () => {
      const exampleUser1 = { id: 1, name: 'User 1' }
      const exampleUser2 = { id: 2, name: 'User 2' }

      const exampleOrgWithUsers = { ...exampleOrg1, users: [exampleUser1, exampleUser2] }

      PrismaClientMock.organisation.findUnique.mockResolvedValueOnce(exampleOrgWithUsers)
      const orgID = 1

      const expectedResult = {
        message: `Got users of organisation with ID: ${orgID}`,
        users: [exampleUser1, exampleUser2],
      }

      await expect(orgController.getOrganisationUsers(orgID)).resolves.toEqual(expectedResult)
    })

    it('should return an empty list if the organisation has no users', async () => {
      const exampleOrgWithoutUsers = { ...exampleOrg1, users: [] }

      PrismaClientMock.organisation.findUnique.mockResolvedValueOnce(exampleOrgWithoutUsers)
      const orgID = 1

      const expectedResult = {
        message: `Got users of organisation with ID: ${orgID}`,
        users: [],
      }

      await expect(orgController.getOrganisationUsers(orgID)).resolves.toEqual(expectedResult)
    })
  })

  describe('addUserToOrganisation', () => {
    it('should add a user to the organisation and return a success message', async () => {
      const exampleUser = { id: 1, name: 'User 1' }
      const exampleOrgWithUsers = { ...exampleOrg1, users: [exampleUser] }

      PrismaClientMock.organisation.update.mockResolvedValueOnce(exampleOrgWithUsers)

      const orgID = 1
      const userID = 1

      const expectedResult = {
        message: `User with ID: ${userID} added to organisation with ID: ${orgID}`,
      }

      await expect(orgController.addUserToOrganisation(orgID, userID)).resolves.toEqual(
        expectedResult,
      )
    })

    it('should return an error message if the user does not exist', async () => {
      const exampleUser1 = { id: 1, name: 'User 1' }
      const exampleOrgWithUsers = { ...exampleOrg1, users: [exampleUser1] }
      PrismaClientMock.organisation.update.mockRejectedValueOnce(exampleOrgWithUsers)

      const orgID = 1
      const expectedResult = {
        message: 'Error adding user to organisation',
        user: null,
      }
      await expect(orgController.addUserToOrganisation(orgID, 2)).resolves.toEqual(expectedResult)
    })

    it('should return an error message if the user is already in the organisation', async () => {
      const exampleUser1 = { id: 1, name: 'User 1' }
      const exampleUser2 = { id: 2, name: 'User 2' }

      const exampleOrgWithUsers = {
        ...exampleOrg1,
        users: [exampleUser1, exampleUser2],
      }
      PrismaClientMock.organisation.findUnique.mockResolvedValueOnce(exampleOrgWithUsers)
      PrismaClientMock.organisation.update.mockResolvedValueOnce(exampleOrgWithUsers)

      const orgID = 1
      const userID = 2

      const expectedResult = {
        message: `User with ID: ${userID} already in organisation with ID: ${orgID}`,
        user: null,
      }
      await expect(orgController.addUserToOrganisation(orgID, userID)).resolves.toEqual(
        expectedResult,
      )
    })
  })

  describe('removeUserFromOrganisation', () => {
    it('should remove a user from the organisation and return a success message', async () => {
      const exampleUser1 = { id: 1, name: 'User 1' }
      const exampleUser2 = { id: 2, name: 'User 2' }

      const exampleOrgWithUsers = {
        ...exampleOrg1,
        users: [exampleUser1, exampleUser2],
      }

      PrismaClientMock.organisation.findUnique.mockResolvedValueOnce(exampleOrg1)
      PrismaClientMock.organisation.update.mockResolvedValueOnce(exampleOrgWithUsers)

      const orgID = 1
      const userID = 1

      const expectedResult = {
        message: `User with ID: ${userID} removed from organisation with ID: ${orgID}`,
        user: null,
      }

      await expect(orgController.removeUserFromOrganisation(orgID, userID)).resolves.toEqual(
        expectedResult,
      )
    })

    it('should return an error message if the user does not exist', async () => {
      const exampleUser1 = { id: 1, name: 'User 1' }
      const exampleUser2 = { id: 2, name: 'User 2' }

      const exampleOrgWithUsers = {
        ...exampleOrg1,
        users: [exampleUser1, exampleUser2],
      }
      PrismaClientMock.organisation.update.mockRejectedValueOnce(exampleOrgWithUsers)

      const orgID = 1
      const userID = 3

      const expectedResult = {
        message: `User with ID: ${userID} not in organisation with ID: ${orgID}`,
        user: null,
      }
      await expect(orgController.removeUserFromOrganisation(orgID, userID)).resolves.toEqual(
        expectedResult,
      )
    })
    it('should return an error message if the user is not in the organisation', async () => {
      const exampleOrgWithUsers = {
        ...exampleOrg1,
        users: [{ id: 2, name: 'User 2' }],
      }
      PrismaClientMock.organisation.update.mockResolvedValueOnce(exampleOrgWithUsers)

      const orgID = 1
      const userID = 2

      const expectedResult = {
        message: `User with ID: ${userID} not in organisation with ID: ${orgID}`,
        user: null,
      }
      await expect(orgController.removeUserFromOrganisation(orgID, userID)).resolves.toEqual(
        expectedResult,
      )
    })
  })
})

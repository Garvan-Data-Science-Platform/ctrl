import { OrganisationsController } from './OrganisationsController'
import { PrismaClientMock } from '../PrismaClientMock'
import { OrganisationCreationRequest, OrganisationUpdateRequest } from 'common/src/index'
import { Prisma } from '../../prisma/generated/client'

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
})

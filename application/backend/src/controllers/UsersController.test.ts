import { UsersController } from './UsersController'
import type { CreateUserRequest, UpdateUserRequest } from '@common/types/api/users'
import { PrismaClientMock } from '../PrismaClientMock'
import { Prisma } from '@prisma/client'

const exampleUser1 = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'johndoe@example.com',
  role: 'Admin',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const exampleUser2 = {
  id: 2,
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'janesmith@example.com',
  role: 'User',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('UsersController', () => {
  let usersController: UsersController

  beforeEach(() => {
    usersController = new UsersController()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllUsers', () => {
    it('should return an empty list of users if the database is empty', async () => {
      PrismaClientMock.user.findMany.mockResolvedValueOnce([])

      const expectedResult = { message: 'Got all users', users: [] }

      await expect(usersController.getAllUsers()).resolves.toEqual(expectedResult)
    })

    it('should return a list of all users in the databse', async () => {
      PrismaClientMock.user.findMany.mockResolvedValueOnce([exampleUser1, exampleUser2])

      const expectedResult = {
        message: 'Got all users',
        users: [exampleUser1, exampleUser2],
      }

      await expect(usersController.getAllUsers()).resolves.toEqual(expectedResult)
    })
  })

  describe('getUserById', () => {
    it('should return a user if the user exists', async () => {
      PrismaClientMock.user.findUnique.mockResolvedValueOnce(exampleUser1)

      const userID = 1

      const expectedResult = { message: `Get user with ID: ${userID}`, user: exampleUser1 }

      await expect(usersController.getUserById(userID)).resolves.toEqual(expectedResult)
    })

    it('should return null if the user does not exist', async () => {
      PrismaClientMock.user.findUnique.mockResolvedValueOnce(null)
      const userID = 1

      const expectedResult = { message: `User with ID: ${userID} not found`, user: null }

      await expect(usersController.getUserById(userID)).resolves.toEqual(expectedResult)
    })
  })

  describe('createUser', () => {
    it('should create a user with the correct User details', async () => {
      PrismaClientMock.user.create.mockResolvedValueOnce(exampleUser1)

      const bodyRequest: CreateUserRequest = {
        firstName: exampleUser1.firstName,
        lastName: exampleUser1.lastName,
        email: exampleUser1.email,
        role: exampleUser1.role,
      }

      const expectedResult = {
        message: `Created user with ID: ${exampleUser1.id}`,
        newUser: exampleUser1,
      }

      await expect(usersController.createUser(bodyRequest)).resolves.toEqual(expectedResult)
    })

    it('should return an error if there is a database error', async () => {
      PrismaClientMock.user.create.mockRejectedValueOnce(new Error('Database error'))

      const bodyRequest: CreateUserRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com',
        role: 'admin',
      }

      const expectedResult = {
        message: 'Error creating user',
        newUser: null,
      }

      await expect(usersController.createUser(bodyRequest)).resolves.toEqual(expectedResult)
    })
  })

  describe('updateUser', () => {
    it('should update a user if the user exists and return the updated user', async () => {
      PrismaClientMock.user.update.mockResolvedValueOnce(exampleUser1)

      const userID = 1
      const bodyRequest: UpdateUserRequest = {
        firstName: 'Jane Doe',
        email: 'janedoe@example.com',
        role: 'Software Developer',
      }

      const expectedResult = {
        message: `Updated user with ID: ${userID}`,
        updatedUser: exampleUser1,
      }

      const result = await usersController.updateUser(userID, bodyRequest)
      expect(result).toEqual(expectedResult)
    })

    it('should return null if the user does not exist', async () => {
      PrismaClientMock.user.update.mockRejectedValueOnce(
        new Prisma.PrismaClientInitializationError(
          'Data not found in db',
          'someClientVersion',
          'P2025',
        ),
      )
      const userID = 1
      const bodyRequest: UpdateUserRequest = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'janedoe@example.com',
        role: 'Software Developer',
      }

      const expectedResult = {
        message: 'Error updating user',
        updatedUser: null,
      }

      const result = await usersController.updateUser(userID, bodyRequest)
      expect(result).toEqual(expectedResult)
    })

    it('should return an error if there is a database error', async () => {
      PrismaClientMock.user.update.mockRejectedValueOnce(new Error('Database error'))
      const userID = 1
      const bodyRequest: UpdateUserRequest = {
        firstName: 'Jane Doe',
        email: 'janedoe@example.com',
        role: 'Software Developer',
      }

      const result = await usersController.updateUser(userID, bodyRequest)
      expect(result).toEqual({
        message: 'Error updating user',
        updatedUser: null,
      })
    })
  })

  describe('deleteUser', () => {
    it('should delete a user and return the deleted user', async () => {
      PrismaClientMock.user.delete.mockResolvedValueOnce(exampleUser1)
      const userID = 1

      const expectedResult = {
        message: `Deleted user with ID: ${userID}`,
        deletedUser: exampleUser1,
      }

      const result = await usersController.deleteUser(userID)
      expect(result).toEqual(expectedResult)
    })

    it('should return null if the user does not exist', async () => {
      PrismaClientMock.user.delete.mockRejectedValueOnce(new Error('Database error'))
      const userID = 1

      const expectedResult = {
        message: 'Error deleting user',
        deletedUser: null,
      }

      const result = await usersController.deleteUser(userID)
      expect(result).toEqual(expectedResult)
    })
  })
})

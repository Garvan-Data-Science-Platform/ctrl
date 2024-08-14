import { UsersController } from './UsersController'
import { type UserCreationRequest, type UserUpdateRequest } from 'common'
import Database from '../Database'

jest.mock('../Database', () => {
  const originalModule = jest.requireActual('../Database')
  return {
    __esModule: true,
    ...originalModule,
    getInstance: jest.fn(),
  }
})

const mockQuery = jest.fn()
jest.spyOn(Database, 'getInstance').mockReturnValue({
  query: mockQuery,
} as unknown as Database)

const exampleUser1 = {
  user_id: 1,
  first_name: 'John',
  email: 'johndoe@example.com',
  user_role: 'Admin',
  organisations: ['Company A', 'Company B'],
  created_at: new Date().toISOString(),
}

const exampleUser2 = {
  user_id: 2,
  first_name: 'Jane',
  email: 'janesmith@example.com',
  user_role: 'User',
  organisations: ['Company C'],
  created_at: new Date().toISOString(),
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
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const expectedResult = { message: 'Got all users', users: [] }

      const result = await usersController.getAllUsers()
      expect(result).toEqual(expectedResult)
    })

    it('should return a list of all users in the databse', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [exampleUser1, exampleUser2] })

      const expectedResult = {
        message: 'Got all users',
        users: [exampleUser1, exampleUser2],
      }

      const result = await usersController.getAllUsers()
      expect(result).toEqual(expectedResult)
    })
  })

  describe('getUserById', () => {
    it('should return a user if the user exists', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [exampleUser1] })

      const userID = 1

      const expectedResult = { message: `Get user w/ ID: ${userID}`, user: exampleUser1 }

      const result = await usersController.getUserById(userID)
      expect(result).toEqual(expectedResult)
    })

    it('should return null if the user does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })
      const userID = 1

      const expectedResult = { message: `User with ID: ${userID} not found`, user: null }

      const result = await usersController.getUserById(userID)
      expect(result).toEqual(expectedResult)
    })
  })

  describe('createUser', () => {
    it('should create a user with the correct User details', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [exampleUser1] })

      const bodyRequest: UserCreationRequest = {
        firstName: exampleUser1.first_name,
        email: exampleUser1.email,
        role: exampleUser1.user_role,
        organisations: exampleUser1.organisations,
      }

      const expectedResult = {
        message: `Created user w/ ID: ${exampleUser1.user_id}`,
        newUser: exampleUser1,
      }

      const result = await usersController.createUser(bodyRequest)
      expect(result).toEqual(expectedResult)
    })

    it('should return an error if there is a database error', async () => {
      const userCreationRequest = {
        firstName: 'John Doe',
        email: 'johndoe@example.com',
        role: 'admin',
        organisations: ['Org1', 'Org2'],
      }

      mockQuery.mockRejectedValueOnce(new Error('Database error'))

      const result = await usersController.createUser(userCreationRequest)
      expect(result).toEqual({
        message: 'Error creating user',
        error: new Error('Database error'),
      })
    })
  })

  describe('updateUser', () => {
    it('should update a user if the user exists and return the updated user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [exampleUser1] })
      mockQuery.mockResolvedValueOnce({ rows: [exampleUser1] })
      mockQuery.mockResolvedValueOnce({ rows: [exampleUser1] })

      const userID = 1
      const bodyRequest: UserUpdateRequest = {
        firstName: 'Jane Doe',
        email: 'janedoe@example.com',
        role: 'Software Developer',
        organisations: ['Org3'],
      }

      const expectedResult = {
        message: `Updated user w/ ID: ${userID}`,
        updatedUser: exampleUser1,
      }

      const result = await usersController.updateUser(userID, bodyRequest)
      expect(result).toEqual(expectedResult)
    })

    it('should return null if the user does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })
      const userID = 1
      const bodyRequest: UserUpdateRequest = {
        firstName: 'Jane Doe',
        email: 'janedoe@example.com',
        role: 'Software Developer',
        organisations: ['Org3'],
      }

      const expectedResult = {
        message: `User w/ ID: ${userID} not found`,
      }

      const result = await usersController.updateUser(userID, bodyRequest)
      expect(result).toEqual(expectedResult)
    })

    it('should return an error if there is a database error', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [exampleUser1] })
      mockQuery.mockRejectedValueOnce(new Error('Database error'))
      const userID = 1
      const bodyRequest: UserUpdateRequest = {
        firstName: 'Jane Doe',
        email: 'janedoe@example.com',
        role: 'Software Developer',
        organisations: ['Org3'],
      }

      const result = await usersController.updateUser(userID, bodyRequest)
      expect(result).toEqual({
        message: 'Error updating user',
        error: new Error('Database error'),
      })
    })
  })

  describe('deleteUser', () => {
    it('should delete a user and return the deleted user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [exampleUser1] })
      mockQuery.mockResolvedValueOnce({ rows: [] })
      const userID = 1

      const expectedResult = {
        message: `Deleted user w/ ID: ${userID}`,
        deletedUser: exampleUser1,
      }

      const result = await usersController.deleteUser(userID)
      expect(result).toEqual(expectedResult)
    })

    it('should return null if the user does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })
      const userID = 1

      const expectedResult = {
        message: `User w/ ID: ${userID} not found`,
      }

      const result = await usersController.deleteUser(userID)
      expect(result).toEqual(expectedResult)
    })
  })
})

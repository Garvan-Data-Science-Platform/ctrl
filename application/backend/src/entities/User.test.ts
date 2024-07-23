import { User } from './User'

describe('User', () => {
  let user: User

  beforeEach(() => {
    user = new User('John', 'john.doe@example.com', 'admin', ['Garvan'])
  })

  test('should create a user with the correct properties', () => {
    expect(user.firstName).toBe('John')
    expect(user.email).toBe('john.doe@example.com')
    expect(user.role).toBe('admin')
    expect(user.organisations).toContain('Garvan')
    expect(user.organisations.length).toBe(1)
    expect(user.createdAt).toBeInstanceOf(Date)
    expect(user.updatedAt).toBeInstanceOf(Date)
  })

  test('should update the firstName and updatedAt fields', () => {
    const originalUpdatedAt = user.updatedAt
    user.updateFirstName('Jane')
    expect(user.firstName).toBe('Jane')
    expect(user.updatedAt).not.toBe(originalUpdatedAt)
  })

  test('should update the email and updatedAt fields', () => {
    const originalUpdatedAt = user.updatedAt
    user.updateEmail('jane.doe@example.com')
    expect(user.email).toBe('jane.doe@example.com')
    expect(user.updatedAt).not.toBe(originalUpdatedAt)
  })

  test('should update the role and updatedAt fields', () => {
    const originalUpdatedAt = user.updatedAt
    user.updateRole('user')
    expect(user.role).toBe('user')
    expect(user.updatedAt).not.toBe(originalUpdatedAt)
  })

  test('should update the organisations and updatedAt fields', () => {
    const originalUpdatedAt = user.updatedAt
    user.updateOrganisations('Some Other Organisation')
    expect(user.organisations.length).toBe(2)
    expect(user.organisations).toContain('Garvan')
    expect(user.organisations).toContain('Some Other Organisation')
    expect(user.updatedAt).not.toBe(originalUpdatedAt)
  })

  test('should differentiate between two users', () => {
    const anotherUser = new User('Jane', 'jane.doe@example.com', 'user', ['Kinghorn'])
    expect(user).not.toBe(anotherUser)
  })
})

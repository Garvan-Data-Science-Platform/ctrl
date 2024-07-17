export class User {
  id: number
  name: string
  email: string
  role: string
  createdAt: Date
  updatedAt: Date

  constructor(id: number, name: string, email: string, role: string) {
    this.id = id
    this.name = name
    this.email = email
    this.role = role
    this.createdAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Updates the user's name.
   *
   * @param newName - The new name to assign to the user. It should be a non-empty string.
   *
   */
  updateName(newName: string): void {
    this.name = newName
    this.updatedAt = new Date()
  }

  /**
   * Updates the user's email address.
   *
   * @param newEmail - The new email address to assign to the user. It should be a valid email format.
   *
   */
  updateEmail(newEmail: string): void {
    this.email = newEmail
    this.updatedAt = new Date()
  }

  /**
   * Updates the user's role.
   *
   * @param newRole - The new role to assign to the user.
   *
   */
  updateRole(newRole: string): void {
    this.role = newRole
    this.updatedAt = new Date()
  }
}

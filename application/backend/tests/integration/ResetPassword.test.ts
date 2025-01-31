import request from 'supertest'
import { Api } from '../../src/Api'
import { resetDB } from 'common/testing/TestHelpers'
import { verifyPassword } from '../../src/authentication'
import prisma from '../../src/PrismaClient'
import { NodemailerMock } from 'nodemailer-mock'
import * as nodemailer from 'nodemailer'

const mockNodeMailer = nodemailer as unknown as NodemailerMock

const api = new Api()
const app = api.app

describe('Password Reset', () => {
  let resetToken: string
  const userId = 105
  const userEmail = 'test-reset-password@example.com'
  const originalPassword = 'OldPassword123'
  const newPassword = 'New@Password123'

  beforeAll(async () => {
    api.run()
    await resetDB()
  })

  afterEach(async () => {
    mockNodeMailer.mock.reset()
  })

  afterAll(async () => {
    api.stop()
  })

  it('should allow a user to login with their current password before reset', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: userEmail, password: originalPassword })

    console.log(response.body)

    expect(response.status).toBe(200)
    expect(response.body.token).not.toBe(undefined)
  })

  it('should generate a password reset link and send an email', async () => {
    const response = await request(app)
      .post('/users/password/generate-reset-link')
      .send({ email: userEmail })

    // Check the response
    expect(response.status).toBe(200)

    // Check the email sent
    const sentMail = mockNodeMailer.mock.getSentMail()
    expect(sentMail).toHaveLength(1)
    expect(sentMail[0]).toMatchObject({
      from: 'CTRL <noreply@ctrl.garvan.org.au>',
      subject: 'CTRL - Password Reset Link',
      to: userEmail,
    })

    // Validate the URL structure
    const emailText = sentMail[0].text as string
    const hostname = process.env.HOSTNAME || 'ctrl.garvan.org.au'
    const urlRegex = new RegExp(
      `${hostname.replace(/\./g, '\\.')}/reset-password\\?token=[a-f0-9]{64}`,
    )

    expect(emailText).toMatch(urlRegex)

    // Save the reset token for further testing
    const resetTokenMatch = emailText.match(/reset-password\?token=(\w+)/)

    if (!resetTokenMatch || !resetTokenMatch[1]) {
      throw new Error('Reset token not found in the email text')
    }

    resetToken = resetTokenMatch[1]
  })

  it('should reset the password successfully', async () => {
    const response = await request(app).post('/users/password/reset').send({
      token: resetToken,
      newPassword,
    })

    // Check the response
    expect(response.status).toBe(200)

    // Check the updated password in the database
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } })
    const isPasswordCorrect = await verifyPassword(updatedUser!.password, newPassword)
    expect(isPasswordCorrect).toBe(true)

    // Check that the reset token was marked as used
    const usedToken = await prisma.passwordResetToken.findUnique({ where: { token: resetToken } })
    expect(usedToken!.used).toBe(true)
  })

  it('should only allow login with the updated password', async () => {
    const loginUrl = '/auth/login'

    // Attempt login with the original password
    const originalPasswordResponse = await request(app).post(loginUrl).send({
      email: userEmail,
      password: originalPassword,
    })

    // Check the response
    expect(originalPasswordResponse.status).toBe(401)
    expect(originalPasswordResponse.body.message).toBe('Incorrect Password')

    // Attempt login with the new password
    const newPasswordResponse = await request(app).post(loginUrl).send({
      email: userEmail,
      password: newPassword,
    })

    // Check the response
    expect(newPasswordResponse.status).toBe(200)
    expect(newPasswordResponse.body).toHaveProperty('token')
  })

  it('should fail to reset the password with an already used token', async () => {
    const response = await request(app).post('/users/password/reset').send({
      token: resetToken,
      newPassword: 'Another@Password123',
    })

    expect(response.status).toBe(403)
    expect(response.body.message).toBe('Reset token has already been used')
  })
})

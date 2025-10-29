import request from 'supertest'
import { Api } from '../../src/Api'
import { resetDB } from 'common/testing/TestHelpers'
import { Role } from '@prisma/client'

import { generateToken } from '../../src/authentication'
import prisma from '../../src/PrismaClient'
import { PARTICIPANT_COMPLETED_ID } from 'common/testing/seed'

const api = new Api()
const app = api.app

describe('Elsa Integration', () => {
  let orgAdminToken: string

  beforeAll(async () => {
    api.run()
    orgAdminToken = await generateToken({ userId: 97, roles: [Role.OrganisationAdmin] })
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  it('Can enable and use elsa integration', async () => {
    await prisma.organisation.updateMany({ data: { elsaToken: null } })

    let response = await request(app)
      .post(`/elsa/enable`)
      .set({ Authorization: `Bearer ${orgAdminToken}` })
    expect(response.ok).toBe(true)
    response = await request(app)
      .get('/elsa/token')
      .set({ Authorization: `Bearer ${orgAdminToken}` })
    const token = response.body.token
    response = await request(app)
      .post('/elsa/duos')
      .set({ Authorization: `Apikey ${token}` })
      .send({ participantIds: [`PID-TEST1-${PARTICIPANT_COMPLETED_ID}`] })
    expect(response.body.data[0].duos).toEqual(['DUO:0000006'])
  })
  it('Can disable elsa integration', async () => {
    let response = await request(app)
      .post(`/elsa/disable`)
      .set({ Authorization: `Bearer ${orgAdminToken}` })
    expect(response.ok).toBe(true)
    response = await request(app)
      .get('/elsa/token')
      .set({ Authorization: `Bearer ${orgAdminToken}` })
    expect(response.body.token).toBeNull()
  })
})

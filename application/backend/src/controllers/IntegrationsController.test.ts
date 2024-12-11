import request from 'supertest'
import { resetDB } from '../../tests/TestHelpers'
import { Api } from '../Api'
import path from 'path'
import { generateToken } from '../authentication'

const api = new Api()
const app = api.app
let token: string

describe('IntegrationsController', () => {
    beforeAll(async () => {
        token = await generateToken({ userId: 99, roles: ['OrganisationAdmin'] })
        api.run()
    })

    beforeEach(async () => {
        await resetDB()
    })

    afterAll(async () => {
        api.stop()
    })

    describe('POST /integrations/redcap/participant/upload', () => {
        it('should register a new user from a given csv', async () => {
            const csvPath = path.resolve(__dirname, '../../tests/test_data/one_user.csv');

            const response = await request(app)
                .post('/integrations/redcap/participant/upload')
                .set({ Authorization: `Bearer ${token}` })
                .attach('file', csvPath); // Attach the file with the field name 'file'

            expect(response.status).toBe(200)
            expect(response.body.message).toBe('created 1 participants')


            const list = await request(app)
                .get('/participants')
                .set({ Authorization: `Bearer ${token}` })
            

            console.log(list.body.data[3])
            // user is actually added
            expect(list.body.data[3].firstName).toBe('John')
            expect(list.body.data[3].lastName).toBe('Smith')
        })

        it('should throw a NotFoundError if a file is empty', async () => {
            //const csvPath = path.resolve(__dirname, '../../tests/example_data/nope.csv');
            const response = await request(app)
                .post('/integrations/redcap/participant/upload')
                .set({ Authorization: `Bearer ${token}` })
            
            console.log(response.status)
            console.log(response.body)
        })
    })
})
import JSON5 from 'json5'
import fs from 'fs'
import path from 'path'
import Ajv from 'ajv'
import { FromSchema } from 'json-schema-to-ts'

//Validate
const schema = {
  type: 'object',
  properties: {
    oidc: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          providerUrl: {
            type: 'string',
          },
          clientId: {
            type: 'string',
          },
          clientSecret: { type: 'string' },
          icon: { type: 'string' },
        },
        required: ['name', 'providerUrl', 'icon', 'clientId', 'clientSecret'],
        additionalProperties: false,
      },
    },
    disableAdminPasswordLogin: { type: 'boolean' },
    otp: {
      type: 'boolean',
    },
    inviteExpiryDays: {
      type: 'number',
    },
  },
  additionalProperties: false,
} as const

export type Config = FromSchema<typeof schema>

const dir = process.env['CONFIG_DIR']
let config: Config = {}
if (dir) {
  fs.readdirSync(dir).map((file) => {
    if (['json', 'json5'].includes(file.toLowerCase().split('.').at(-1) || '')) {
      config = { ...config, ...JSON5.parse(fs.readFileSync(path.join(dir, file), 'ascii')) }
    }
  })
}

const ajv = new Ajv()
const validate = ajv.compile(schema)
if (!validate(config)) {
  console.error('Config validation error', validate.errors)
  throw new Error('Invalid config')
}

if (process.env.NODE_ENV !== 'production') {
  console.log('CONFIG', config)
}

export default config

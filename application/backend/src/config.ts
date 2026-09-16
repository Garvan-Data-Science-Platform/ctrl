import JSON5 from 'json5'
import fs from 'fs'
import path from 'path'
import Ajv from 'ajv'
import { FromSchema } from 'json-schema-to-ts'

// Blind-index hash salts must exist in every environment (schema.prisma references them via ?saltEnv=NAME).
// Deliberately outside the NODE_ENV !== 'test' guard below: tests hash too, so a missing salt in a test env
// must fail loudly rather than silently fall back to unsalted hashing.
for (const name of [
  'EMAIL_HASH_SALT',
  'FIRST_NAME_HASH_SALT',
  'LAST_NAME_HASH_SALT',
  'DOB_HASH_SALT',
]) {
  if (!process.env[name]) {
    throw new Error(`${name} is required. See application/backend/.env.example.`)
  }
}

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
            minLength: 1,
          },
          clientId: {
            type: 'string',
            minLength: 1,
          },
          clientSecret: { type: 'string', minLength: 1 },
          icon: { type: 'string', minLength: 1 },
          displayInAdminPortal: { type: 'boolean', default: true },
          displayInUserPortal: { type: 'boolean', default: true },
          authorizeUrlParams: { type: 'string', default: '' },
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
    smtp: {
      type: 'object',
      properties: {
        host: {
          type: 'string',
        },
        port: {
          type: 'number',
        },
        username: {
          type: 'string',
        },
        password: {
          type: 'string',
        },
      },
      required: ['host', 'port', 'username', 'password'],
      additionalProperties: false,
    },
  },
  required: ['smtp'],
  additionalProperties: false,
} as const

export type Config = FromSchema<typeof schema>

const dir = process.env['CONFIG_DIR']
let config = {}
if (process.env.NODE_ENV !== 'test') {
  if (dir) {
    fs.readdirSync(dir).map((file) => {
      if (['json', 'json5'].includes(file.toLowerCase().split('.').at(-1) || '')) {
        config = { ...config, ...JSON5.parse(fs.readFileSync(path.join(dir, file), 'ascii')) }
      }
    })
  }

  const ajv = new Ajv({ useDefaults: true })
  const validate = ajv.compile(schema)

  if (!validate(config)) {
    throw new Error(`Invalid config ${JSON.stringify(validate.errors)}`)
  }
} else {
  config = { smtp: { host: 'x', port: 1, username: 'x', password: 'x' } }
}

if (process.env.NODE_ENV !== 'production') {
  console.log('CONFIG', config)
}

export default config as Config

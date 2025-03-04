import * as fs from 'fs'
import * as path from 'path'

const schemaFilePath: string = path.join(__dirname, '../swagger.json')

// Load OpenAPI schema file
const openapiSchema = JSON.parse(fs.readFileSync(schemaFilePath, 'utf-8'))

interface Schema {
  $ref?: string
  properties?: Record<string, unknown>
  required?: string[]
  type?: string
  description?: string
}

interface OpenAPI {
  openapi: string
  components: {
    schemas: Record<string, Schema>
  }
}

// Cast loaded JSON as OpenAPI type
const openapi: OpenAPI = openapiSchema as OpenAPI

// Function to replace $ref with actual schema definition
function replaceRefsWithSchemas(schemas: Record<string, Schema>) {
  for (const [schemaName, schemaDefinition] of Object.entries(schemas)) {
    // Check if the schema is a $ref to "DefaultSelection_Prisma"
    if (
      schemaDefinition.$ref &&
      (schemaDefinition.$ref.startsWith('#/components/schemas/DefaultSelection_Prisma') ||
        schemaDefinition.$ref.startsWith('#/components/schemas/_36_Enums'))
    ) {
      console.log(`Found ${schemaDefinition.$ref} to be replaced with ${schemaName}`)

      // Extract the referenced schema name
      const refName = schemaDefinition.$ref.split('/').pop()

      // Replace $ref with schema
      if (refName && schemas[refName]) {
        schemas[schemaName] = { ...schemas[schemaName], ...schemas[refName] }

        // Remove the referenced schema and remove DefaultSelection_Prisma
        delete schemas[refName]
        delete schemas[schemaName].$ref
      }
    }
  }
}

// Replace all $refs in the schema
replaceRefsWithSchemas(openapi.components.schemas)

// Save the modified schema back to a file
fs.writeFileSync(schemaFilePath, JSON.stringify(openapi, null, 2), 'utf-8')

console.log('Schema references replaced successfully!')

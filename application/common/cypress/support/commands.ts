// Shared Cypress commands
export enum UserType {
  PARTICIPANT_COMPLETED = 'test3@example.com',
  PARTICIPANT_UNANSWERED = 'test2@example.com',
  ADMIN = 'admin@example.com',
  // TODO: Add study admin here
}

const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  tif: 'image/tif',
  // ADDITIONAL TYPES BELOW
  // gif: 'image/gif',
  // svg: 'image/svg+xml',
  // pdf: 'application/pdf',
  // csv: 'text/csv'
}

Cypress.Commands.add('uploadCommonFile', (selector, fileName) => {
  cy.task('readCommonFile', fileName).then((base64) => {
    if (!base64) throw new Error(`File "${fileName}" not found in common fixtures.`)

    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    const mimeType = MIME_TYPES[extension] || 'application/octet-stream'
    // Note: this gets the first element matched
    //   for Settings page there is only one logo upload component
    //   but studies page can have multiple.
    //   If this is problematic, one option is to pass in an id and use string interpolation in the data-cy tag
    cy.get(selector)
      .first()
      .selectFile(
        {
          contents: Cypress.Buffer.from(base64 as string, 'base64'),
          fileName: fileName,
          mimeType: mimeType,
        },
        { force: true },
      )
  })
})

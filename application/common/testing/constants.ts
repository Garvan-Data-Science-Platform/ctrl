// Constants shared for all tests

// Test user credentials (from seed data)
export const TestUsers = {
  // TODO: Add study admin here
  ADMIN: {
    email: 'admin@example.com',
    password: 'Testpassword1',
  },
  PARTICIPANT_UNANSWERED: {
    email: 'test2@example.com',
    password: 'Testpassword1',
  },
  PARTICIPANT_COMPLETED: {
    email: 'test3@example.com',
    password: 'Testpassword1',
  },
}

// App URLs
export const AppUrls = {
  ADMIN_CLIENT: 'http://localhost:5003',
  USER_CLIENT: 'http://localhost:5002',
  API: 'http://localhost:5000',
}

export const MIME_TYPES: Record<string, string> = {
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

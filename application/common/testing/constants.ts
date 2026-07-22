// Constants shared for all tests

// Test user credentials (for seed data and tests)
export const TestUsers = {
  OPERATOR_ADMIN: {
    email: 'operatoradmin@example.com',
    password: 'Loginforadmin1',
    id: 96,
  },
  ORG_ADMIN: {
    email: 'admin@example.com',
    password: 'Loginforadmin1',
    id: 97,
  },
  ORG_ADMIN_2: {
    email: 'admin2@example.com',
    password: 'Loginforadmin1',
    id: 101,
  },
  PARTICIPANT_UNANSWERED: {
    email: 'test2@example.com',
    password: 'Loginforuser12',
    id: 98,
  },
  PARTICIPANT_COMPLETED: {
    email: 'test3@example.com',
    password: 'Loginforuser12',
    id: 99,
  },
  GUARDIAN_2: {
    email: 'g2@example.com',
    password: 'Loginforuser12',
    id: 102,
  },
  DEPENDENT: {
    id: 100,
  },
  STUDY_ADMIN: {
    email: 'studyadmin@example.com',
    password: 'Loginforadmin1',
    id: 106,
  },
  PASSWORD_RESET_USER: {
    id: 105,
    email: 'test-reset-password@example.com',
    password: 'Oldloginforuser1',
  },
}

export const TestStudies = {
  TEST_STUDY: {
    name: 'Test Study',
    id: 1,
  },
  TEST_STUDY_2: {
    name: 'Study 2',
    id: 2,
  },
  FE_TEST_STUDY: {
    name: 'Study FE',
    id: 3,
  },
  EMPTY_TEST_STUDY: {
    name: 'Empty Study',
  },
}

export const TestInvites = {
  INVITE_PENDING: {
    email: 'invite1@pending.com',
  },
  INVITE_2_PENDING: {
    email: 'invite2@pending.com',
  },
  INVITE_ACCEPTED: {
    email: 'invite@accepted.com',
  },
  INVITE_REVOKED: {
    email: 'invite@revoked.com',
  },
  INVITE_EXPIRED: {
    email: 'invite@expired.com',
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

export const commonPasswordBaseWords = ['Password', 'Changeme', 'Welcome']

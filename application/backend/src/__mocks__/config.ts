import { TestOIDC } from 'common/testing/constants'

const config = {
  oidc: [
    {
      ...TestOIDC.PROVIDER,
      icon: 'https://aaf.edu.au/wp-content/uploads/AAF_LGO_small-website.png',
      clientSecret: 'testsecret',
    },
  ],
  otp: false,
  inviteExpiryDays: 7,
  smtp: {
    host: 'smtp.ethereal.email',
    port: 587,
    username: 'piper.gorczany60@ethereal.email',
    password: 'FK1DCrQYv2BzFYNf4k',
  },
}

export default config

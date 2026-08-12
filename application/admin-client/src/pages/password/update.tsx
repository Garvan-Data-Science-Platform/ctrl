import { checkPasswordStrength } from '@common/src/PasswordStrength'
import { Card, Typography } from '@mui/material'
import { useParsed } from '@refinedev/core'
import { AuthPage } from '@refinedev/mui'

export const UpdatePassword = () => {
  const { params } = useParsed()
  const token = params?.token

  if (!token) {
    return (
      <Card sx={{ p: 2, width: 400, m: 'auto', mt: 20 }}>
        <Typography fontWeight="bold">Invalid password reset link</Typography>
        <br />
        <Typography>
          <a href="/forgot-password">Request a new password reset link</a>.
        </Typography>
        <br />
        <Typography>
          <a href="/login">Return to login page</a>
        </Typography>
      </Card>
    )
  }

  return (
    <AuthPage
      type="updatePassword"
      title={<a href="/">Go back</a>}
      mutationVariables={{ token }}
      formProps={{
        mode: 'onSubmit',
        resolver: async (data) => {
          if (!data.password) {
            return {
              values: {},
              errors: { password: { type: 'required', message: 'This field is required' } },
            }
          }

          const password = data.password.trim()

          if (password !== data.confirmPassword?.trim()) {
            return {
              values: {},
              errors: { password: { type: 'validate', message: "Passwords don't match" } },
            }
          }

          const { isValid, fields } = checkPasswordStrength(password)
          if (!isValid) {
            return {
              values: {},
              errors: {
                password: {
                  type: 'validate',
                  message: `Invalid password. ${Object.values(fields).map((f) => ' ' + f.message)}`,
                },
              },
            }
          }
          return {
            values: { ...data, password },
            errors: {},
          }
        },
      }}
    />
  )
}

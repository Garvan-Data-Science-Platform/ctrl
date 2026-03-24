import { checkPasswordStrength } from '@common/src/PasswordStrength'
import { useParsed } from '@refinedev/core'
import { AuthPage } from '@refinedev/mui'

export const UpdatePassword = () => {
  const { params } = useParsed()
  const token = params?.token

  if (!token) {
    return (
      <div>
        <p>Invalid or missing password reset token.</p>
        <p>
          Please <a href="/forgot-password">request a new password reset link</a>.
        </p>
      </div>
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

          if (data.password !== data.confirmPassword) {
            return {
              values: {},
              errors: { password: { type: 'validate', message: "Passwords don't match" } },
            }
          }

          const { isValid, fields } = checkPasswordStrength(data.password)
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
            values: data,
            errors: {},
          }
        },
      }}
    />
  )
}

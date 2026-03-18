import { checkPasswordStrength } from '@common/src/PasswordStrength'
import { useParsed } from '@refinedev/core'
import { AuthPage } from '@refinedev/mui'

export const UpdatePassword = () => {
  const { params } = useParsed()
  return (
    <AuthPage
      type="updatePassword"
      title={<a href="/">Log in</a>}
      mutationVariables={{ token: params?.token }}
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

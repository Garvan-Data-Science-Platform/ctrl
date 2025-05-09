import { Visibility, VisibilityOff } from '@mui/icons-material'
import { IconButton, InputAdornment, TextField, TextFieldProps } from '@mui/material'
import { forwardRef, useState } from 'react'

export const SensitiveTextField = forwardRef((props: TextFieldProps, ref) => {
  const [isHidden, setIsHidden] = useState(true)

  return (
    <TextField
      {...props}
      ref={ref as any}
      type={isHidden ? 'password' : 'text'}
      autoComplete="off"
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={!isHidden ? 'hide the password' : 'display the password'}
                onClick={() => {
                  setIsHidden(!isHidden)
                }}
                edge="end"
              >
                {!isHidden ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  )
})

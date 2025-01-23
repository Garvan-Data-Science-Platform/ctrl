import AppBar from '@mui/material/AppBar'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import { HamburgerMenu, RefineThemedLayoutV2HeaderProps } from '@refinedev/mui'
import React from 'react'

export const Header: React.FC<RefineThemedLayoutV2HeaderProps> = ({ sticky = true }) => {
  return (
    <AppBar position={sticky ? 'sticky' : 'relative'}>
      <Toolbar>
        <Stack direction="row" width="100%" justifyContent="flex-start" alignItems="center">
          <HamburgerMenu />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

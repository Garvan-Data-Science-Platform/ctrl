import { Menu, MenuItem, Button, Divider } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import { HamburgerMenu, RefineThemedLayoutHeaderProps } from '@refinedev/mui'
import React, { useState } from 'react'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { useStudyStore } from '../../studyStore'
import { Link, useParsed } from '@refinedev/core'

export const Header: React.FC<RefineThemedLayoutHeaderProps> = ({ sticky = true }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const studyMenuOpen = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleCloseStudyMenu = () => {
    setAnchorEl(null)
  }

  const { resource, action } = useParsed()

  const { studies, activeStudyIndex, setActiveStudyIndex } = useStudyStore()

  return (
    <AppBar position={sticky ? 'sticky' : 'relative'}>
      <Toolbar>
        <Stack
          direction="row"
          width="100%"
          justifyContent="flex-start"
          alignItems="center"
          spacing={2}
        >
          <HamburgerMenu />
          {['settings', 'users', 'studies', 'restore'].includes(resource?.name || '') ? (
            <Button
              color="inherit"
              sx={{ ml: 2, textTransform: 'none' }}
              component={Link as any}
              to="/studies"
              data-cy="manage-studies"
            >
              Manage Studies
            </Button>
          ) : (
            <>
              <Button
                color="inherit"
                onClick={handleClick}
                sx={{ ml: 2, textTransform: 'none' }}
                endIcon={<ArrowDropDownIcon />}
                disabled={resource?.name == 'surveys' && action == 'edit'}
                data-cy="study-dropdown"
              >
                {studies[activeStudyIndex].name}
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={studyMenuOpen}
                onClose={handleCloseStudyMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                sx={{ p: 3 }}
                data-cy="study-menu"
              >
                {studies.map((study, idx) => {
                  return (
                    <MenuItem
                      key={study.id}
                      onClick={() => {
                        setActiveStudyIndex(idx)
                        handleCloseStudyMenu()
                      }}
                      sx={{ fontWeight: activeStudyIndex == idx ? 'bold' : 'normal' }}
                    >
                      {study.name}
                    </MenuItem>
                  )
                })}
                <Divider />
                {/* 
                // @ts-ignore */}
                <MenuItem
                  component={Link}
                  onClick={handleCloseStudyMenu}
                  to="/studies"
                  data-cy="manage-studies"
                >
                  Manage Studies
                </MenuItem>
              </Menu>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

import {
  Menu,
  MenuItem,
  Button,
  Dialog,
  TextField,
  DialogTitle,
  DialogContent,
  Divider,
} from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import { HamburgerMenu, RefineThemedLayoutV2HeaderProps } from '@refinedev/mui'
import React, { useState } from 'react'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { useStudyStore } from '../../studyStore'
import { useInvalidate, useParsed } from '@refinedev/core'
import { axiosInstance } from '../../providers/dataProvider'
import { useQueryClient } from '@tanstack/react-query'

export const Header: React.FC<RefineThemedLayoutV2HeaderProps> = ({ sticky = true }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const studyMenuOpen = Boolean(anchorEl)
  const [newStudyDialogOpen, setNewStudyDialogOpen] = useState(false)
  const [newStudyName, setNewStudyName] = useState('')
  const queryClient = useQueryClient()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleCloseStudyMenu = () => {
    setAnchorEl(null)
  }

  const handleCloseNewStudyDialog = () => {
    setNewStudyDialogOpen(false)
  }

  const handleCreateNewStudy = (e: React.FormEvent) => {
    e.preventDefault()
    axiosInstance.post('studies', { name: newStudyName }).then(() => {
      handleCloseNewStudyDialog()
      queryClient.invalidateQueries(['studies'])
    })
  }

  const { resource, action } = useParsed()

  const { studies, activeStudyIndex, setActiveStudyIndex } = useStudyStore()
  const invalidate = useInvalidate()

  return (
    <AppBar position={sticky ? 'sticky' : 'relative'}>
      <Dialog open={newStudyDialogOpen} onClose={handleCloseNewStudyDialog}>
        <DialogTitle>Create New Study</DialogTitle>
        <DialogContent>
          <Stack spacing={2} p={1} component="form" onSubmit={handleCreateNewStudy}>
            <TextField
              required
              label="Study Name"
              value={newStudyName}
              onChange={(e) => setNewStudyName(e.target.value)}
              data-cy="study-name"
            />
            <Stack direction="row" justifyContent="space-between">
              <Button variant="contained" type="submit" data-cy="study-create">
                Create
              </Button>
              <Button onClick={handleCloseNewStudyDialog}>Cancel</Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
      <Toolbar>
        <Stack
          direction="row"
          width="100%"
          justifyContent="flex-start"
          alignItems="center"
          spacing={2}
        >
          <HamburgerMenu />
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

            <MenuItem
              onClick={() => {
                handleCloseStudyMenu()
                setNewStudyDialogOpen(true)
              }}
              data-cy="new-study-button"
            >
              Add new study
            </MenuItem>
          </Menu>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

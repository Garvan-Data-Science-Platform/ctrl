import * as React from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import MenuIcon from '@mui/icons-material/Menu'
import Container from '@mui/material/Container'
import MenuItem from '@mui/material/MenuItem'
import AdbIcon from '@mui/icons-material/Adb'
import { Button, Tab, Tabs } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

const pages = [
  { name: 'My Activities', route: '/' },
  { name: 'My Personal Details', route: '/profile', alt: ['/profile/update'] },
  { name: 'Contact us', route: '/contact', alt: ['/message_sent'] },
  { name: 'News and Information', route: '/news' },
  { name: 'Glossary', route: '/glossary' },
]

export default function NavBar() {
  const location = useLocation()
  const nav = useNavigate()
  const { logout } = useAuth()
  const activePage =
    pages
      .filter((val) => val.route == location.pathname || val.alt?.includes(location.pathname))
      .at(0) || pages[0]
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null)

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget)
  }

  const handleCloseNavMenu = () => {
    setAnchorElNav(null)
  }

  return (
    <AppBar position="static" sx={{ boxShadow: 'none', left: 0, backgroundColor: 'white' }}>
      <Container sx={{ maxWidth: 1200 }}>
        <Toolbar disableGutters>
          <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Box>
            <img
              src={import.meta.env.VITE_BACKEND_URL + '/settings/logo'}
              height={30}
              onClick={() => nav('/')}
              style={{ marginRight: 20, cursor: 'pointer' }}
              data-cy="logo"
              alt="logo"
            />
          </Box>

            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                data-cy="hamburger"
              >
                <MenuIcon color="inherit" />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{ display: { xs: 'block', md: 'none' } }}
              >
                {pages.map((page) => (
                  <MenuItem key={page.name} onClick={() => nav(page.route)}>
                    <Typography sx={{ textAlign: 'center' }}>{page.name}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            <AdbIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              <Tabs value={activePage.name}>
                {pages.map((page) => (
                  <Tab
                    value={page.name}
                    key={page.name}
                    label={page.name}
                    onClick={() => nav(page.route)}
                  />
                ))}
              </Tabs>
            </Box>
            <Box sx={{ flexGrow: 0 }}>
              <Button data-cy="log-out" variant="outlined" onClick={logout}>
                Log Out
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </nav>
  )
}

import { useCustom, useInvalidate, useLogout } from '@refinedev/core'
import React, { PropsWithChildren, useEffect } from 'react'
import { useStudyStore } from '../studyStore'
import { Box, Button, Typography } from '@mui/material'

export const StudyLoader: React.FC<PropsWithChildren> = ({ children }) => {
  const { data } = useCustom({
    url: `studies`,
    method: 'get',
    queryOptions: { queryKey: ['studies'] },
  })
  const { studies, setStudies, activeStudyIndex, setActiveStudyIndex } = useStudyStore()
  const invalidate = useInvalidate()
  const { mutate: logout } = useLogout()

  useEffect(() => {
    if (data) {
      const studiesLength = studies.length
      setStudies(data.data.data as any)
      if (
        studies.length > 0 &&
        (data.data.data.length - studiesLength == 1 || activeStudyIndex > studies.length)
      ) {
        setActiveStudyIndex(studies.length) // Ie new study created
      }
    }
  }, [data])

  useEffect(() => {
    localStorage.setItem('activeStudyIndex', String(activeStudyIndex))
    invalidate({ invalidates: ['all'] })
  }, [activeStudyIndex])

  return studies.length > 0 ? (
    children
  ) : (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
    >
      <Typography>You do not have access to any studies</Typography>
      <Button onClick={() => logout()}>Log out</Button>
    </Box>
  )
}

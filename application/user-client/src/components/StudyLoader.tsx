import React, { PropsWithChildren, useEffect } from 'react'
import { useAppStore } from '../store'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { apiClient } from '../apiClient'
import NavBar from '../components/NavBar'
import { CircularProgress, Container, Typography } from '@mui/material'
import type { GetAllStudiesResponse } from '@common/types/api/studies'

export const StudyLoader: React.FC<PropsWithChildren> = ({ children }) => {
  const { data: data, error } = useQuery({
    queryKey: ['studies', 'get'],
    queryFn: () =>
      apiClient.get('/studies/list').then((res) => res.data) as Promise<GetAllStudiesResponse>,
  })

  const { studies, activeStudyIndex, setStudies, setActiveStudyIndex } = useAppStore()

  const queryClient = useQueryClient()

  const [searchParams] = useSearchParams()
  const studyId = searchParams.get('studyId')

  useEffect(() => {
    if (data?.data) {
      setStudies(data.data as any)
      if (studyId) {
        setActiveStudyIndex(data.data.findIndex((val) => val.id == Number(studyId)))
      }
    }
  }, [data, studyId, setStudies, setActiveStudyIndex, activeStudyIndex])

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['steps'] })
  }, [activeStudyIndex])

  if (error) {
    return (
      <>
        <NavBar />
        <Container>
          <Typography>Error: {error.message}</Typography>
        </Container>
      </>
    )
  }
  const hasValidActiveStudy =
    studies.length > 0 &&
    activeStudyIndex >= 0 &&
    activeStudyIndex < studies.length &&
    studies[activeStudyIndex]

  return hasValidActiveStudy ? (
    children
  ) : (
    <div>
      <>
        <NavBar />
        <Container>
          <CircularProgress sx={{ mt: 20 }} />
        </Container>
      </>
    </div>
  )
}

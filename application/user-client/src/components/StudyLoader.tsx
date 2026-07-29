import React, { PropsWithChildren, useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { apiClient } from '../apiClient'
import NavBar from '../components/NavBar'
import { CircularProgress, Container, Typography } from '@mui/material'
import type { GetAllStudiesResponse } from '@common/types/api/studies'
import Contact from '../pages/Contact'

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
  const prevStudiesRef = useRef<any>([])

  useEffect(() => {
    if (data?.data) {
      setStudies(data.data as any)
      if (studyId) {
        setActiveStudyIndex(data.data.findIndex((val) => val.id == Number(studyId)))
      }
      if (activeStudyIndex >= data.data.length) {
        setActiveStudyIndex(0)
      }
    }
  }, [data])

  useEffect(() => {
    if (
      prevStudiesRef.current.length > 0 &&
      studies !== null &&
      studies.length > prevStudiesRef.current.length
    ) {
      //A new study was added after old studies already loaded
      const old_ids = prevStudiesRef.current.map((v: any) => v.id)
      const newStudyIdx = studies.findIndex((s) => !old_ids.includes(s.id))
      setActiveStudyIndex(newStudyIdx)
    }
    if (studies !== null) {
      prevStudiesRef.current = studies
    }
  }, [studies])

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
    studies !== null &&
    studies.length > 0 &&
    activeStudyIndex >= 0 &&
    activeStudyIndex < studies.length &&
    studies[activeStudyIndex]

  if (studies !== null && studies.length < 1) {
    return (
      <>
        <NavBar disabled />
        <Container>
          {!window.location.href.includes('message_sent') ? (
            <>
              <Typography sx={{ mt: 5 }}>
                You are no longer participating in any studies. If you think this is a mistake,
                contact us using the form below:
              </Typography>
              <Contact disableHeader />
            </>
          ) : (
            <Typography sx={{ mt: 5 }}>Message sent</Typography>
          )}
        </Container>
      </>
    )
  }

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

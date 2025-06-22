import React, { PropsWithChildren, useEffect } from 'react'
import { useAppStore } from '../store'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'

export const StudyLoader: React.FC<PropsWithChildren> = ({ children }) => {
  const { data } = {
    data: [
      { name: 'Test Study', id: 1 },
      { name: 'Study FE', id: 3 },
    ],
  }
  const { studies, activeStudyIndex, setStudies, setActiveStudyIndex } = useAppStore()

  const queryClient = useQueryClient()

  const [searchParams] = useSearchParams()
  const studyId = searchParams.get('studyId')

  useEffect(() => {
    if (data) {
      setStudies(data as any)
      if (studyId) {
        setActiveStudyIndex(data.findIndex((val) => val.id == Number(studyId)))
      }
    }
  }, [])

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['steps'] })
  }, [activeStudyIndex])

  return studies.length > 0 && children
}

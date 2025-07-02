import { useCustom, useInvalidate } from '@refinedev/core'
import React, { PropsWithChildren, useEffect } from 'react'
import { useStudyStore } from '../studyStore'

export const StudyLoader: React.FC<PropsWithChildren> = ({ children }) => {
  const { data } = useCustom({
    url: `studies`,
    method: 'get',
    queryOptions: { queryKey: ['studies'] },
  })
  const { studies, setStudies, activeStudyIndex, setActiveStudyIndex } = useStudyStore()
  const invalidate = useInvalidate()

  useEffect(() => {
    if (data) {
      const studiesLength = studies.length
      setStudies(data.data.data as any)
      if (data.data.data.length - studiesLength == 1) setActiveStudyIndex(studies.length) // Ie new study created
    }
  }, [data])

  useEffect(() => {
    localStorage.setItem('activeStudyIndex', String(activeStudyIndex))
    invalidate({ invalidates: ['all'] })
  }, [activeStudyIndex])

  return studies.length > 0 && children
}

import { useCustom } from '@refinedev/core'
import React, { PropsWithChildren, useEffect } from 'react'
import { useStudyStore } from '../studyStore'

export const StudyLoader: React.FC<PropsWithChildren> = ({ children }) => {
  const { data } = useCustom({
    url: `studies`,
    method: 'get',
    queryOptions: { queryKey: ['studies'] },
  })
  const { studies, setStudies } = useStudyStore()

  useEffect(() => {
    if (data) {
      setStudies(data.data.data as any)
    }
  }, [data])

  return studies.length > 0 && children
}

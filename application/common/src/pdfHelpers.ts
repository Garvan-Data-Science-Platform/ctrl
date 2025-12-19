/// <reference types="vite/client" />

import { pdf } from '@react-pdf/renderer'

//Pure utility for filename and logo logic
export const pdfUtils = {
  formatFileName: (prefix: string, studyName: string, participantName = '') => {
    const now = new Date()
    const cleanDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`

    // Format studyName to make it appropriate for inclusion in a file name:
    //   - no whitespace
    //   - no characters in this list: `/\<>|:&`
    //   - constrained to a maximum number of characters (nominally 100, to allow space for participant's name)
    const cleanStudyName = studyName.replace(/[\s/<\\>|:&]+/g, '_').substring(0, 99)

    const cleanParticipantName = participantName ? `-${participantName}` : ''

    return `${prefix}-${cleanStudyName}${cleanParticipantName}_${cleanDate}.pdf`
  },

  getLogoUrls: (studyId?: number) => ({
    orgLogo: `${import.meta.env.VITE_BACKEND_URL}/settings/logo`,
    studyLogo: studyId ? `${import.meta.env.VITE_BACKEND_URL}/studies/${studyId}/logo` : null,
  }),
}

export const downloadPdfBlob = async (pdfDoc: React.ReactElement, fileName: string) => {
  const blob = await pdf(pdfDoc).toBlob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  // Clean up the URL object to save memory
  setTimeout(() => URL.revokeObjectURL(link.href), 100)
}

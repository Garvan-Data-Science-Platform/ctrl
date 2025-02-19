import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { GetParticipantProfileResponse } from '@common/types/api/users'
import { GetResponsesByIdResponse } from '@common/types/api/surveys'

export async function createPdf(
  profile: GetParticipantProfileResponse,
  responses: GetResponsesByIdResponse,
) {
  try {
    const pdfDoc = await PDFDocument.create()
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)

    const page = pdfDoc.addPage()
    const { height } = page.getSize()
    const fontSize = 15
    page.drawText(`Responses for ${profile.data.firstName} ${profile.data.lastName}`, {
      x: 50,
      y: height - 4 * fontSize,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0, 0.53, 0.71),
    })

    page.drawText(
      `${responses.data[1].elements[0].data.text}: ${responses.data[1].elements[0].data.value}`,
      {
        x: 50,
        y: height - 5 * fontSize,
        size: fontSize,
        font: timesRomanFont,
        color: rgb(0, 0.53, 0.71),
      },
    )
    const pdfBytes = await pdfDoc.save()

    // Create a Blob from the PDF bytes
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })

    // Create a link element
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'Ctrl-responses.pdf'

    // Trigger the download
    document.body.appendChild(link)
    link.click()

    // Clean up
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating PDF:', error)
  }
}

export function formatStudyName(studyName: string) {
  // Format studyName to make it appropriate for inclusion in a file name:
  //   - no whitespace
  //   - no characters in this list: `/\<>|:&`
  //   - constrained to a maximum number of characters (nominally 100, to allow space for participant's name)
  return studyName.replace(/[\s/<\\>|:&]+/g, '_').substring(0, 99)
}

function validateAndFormatDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  // months are zero indexed in JS :(
  const dateObj = new Date(year, month - 1, day)
  if (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  ) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  return null
}

export function fromExcelDateToISO(dateString?: string | null): string | null {
  if (!dateString) return null

  const trimmed = dateString.trim()
  // handle YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/)
  if (ymdMatch) {
    // index 0 (skipped) is full regex match
    const [, y, m, d] = ymdMatch
    // specify base ten incase of leading zeros
    return validateAndFormatDate(parseInt(y, 10), parseInt(m, 10), parseInt(d, 10))
  }

  // handle DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (dmyMatch) {
    // get the three match groups
    // specify base ten incase of leading zeros
    // index 0 (skipped) is full regex match
    const [, p1, p2, p3] = dmyMatch
    const n1 = parseInt(p1, 10)
    const n2 = parseInt(p2, 10)
    const year = parseInt(p3, 10)

    let day = n1
    let month = n2

    // guess if US format, default to non-US format
    if (n2 > 12) {
      month = n1
      day = n2
    } else if (n1 > 12) {
      day = n1
      month = n2
    } else {
      day = n1
      month = n2
    }

    return validateAndFormatDate(year, month, day)
  }
  // if no match at all
  return null
}

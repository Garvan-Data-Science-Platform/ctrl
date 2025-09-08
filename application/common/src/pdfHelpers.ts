export function formatStudyName(studyName: string) {
  // Format studyName to make it appropriate for inclusion in a file name:
  //   - no whitespace
  //   - no characters in this list: `/\<>|:&`
  //   - constrained to a maximum number of characters (nominally 100, to allow space for participant's name)
  return studyName.replace(/[\s/<\\>|:&]+/g, '_').substring(0, 99)
}

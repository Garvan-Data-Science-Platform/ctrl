import { fromExcelDateToISO } from './utils'

describe('Date utility tests', () => {
  const validDatewithDash = '1992-07-20'
  const validDateWithSlash = '1992/07/20'
  const validDDMMYYYDateWithSlash = '20/07/1992'
  const validDDMMYYYDateWithDash = '20-07-1992'
  const unambiguousMMDDYYYDate = '07-20-1992'

  it('Correctly parses YYYY MM DD with slashes', () => {
    expect(fromExcelDateToISO(validDateWithSlash)).toEqual(validDatewithDash)
  })
  it('Correctly parses YYYY MM DD with dashes', () => {
    expect(fromExcelDateToISO(validDatewithDash)).toEqual(validDatewithDash)
  })
  it('Correctly parses DD MM YYYY with slashes', () => {
    expect(fromExcelDateToISO(validDDMMYYYDateWithSlash)).toEqual(validDatewithDash)
  })
  it('Correctly parses DD MM YYYY with dashes', () => {
    expect(fromExcelDateToISO(validDDMMYYYDateWithDash)).toEqual(validDatewithDash)
  })
  it('Correctly parses unambiguous MM DD YYYY', () => {
    expect(fromExcelDateToISO(unambiguousMMDDYYYDate)).toEqual(validDatewithDash)
  })
  it('Correctly defaults to DD MM YYYY with ambiguous dates', () => {
    expect(fromExcelDateToISO('06-07-2026')).toEqual('2026-07-06')
  })
  it('returns null for impossible dates', () => {
    expect(fromExcelDateToISO('2026-13-32')).toBe(null)
  })
})

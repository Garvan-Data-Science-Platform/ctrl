import { fromExcelDateToISO } from './utils'

describe('Date utility tests', () => {
  const validDatewithDash = '1992-07-20'
  const validDateWithSlash = '1992/07/20'
  const validDDMMYYYYDateWithSlash = '20/07/1992'
  const validDDMMYYYYDateWithDash = '20-07-1992'
  const unambiguousMMDDYYYYDate = '07-20-1992'

  it('Correctly parses YYYY MM DD with slashes', () => {
    expect(fromExcelDateToISO(validDateWithSlash)).toEqual(validDatewithDash)
  })
  it('Correctly parses YYYY MM DD with dashes', () => {
    expect(fromExcelDateToISO(validDatewithDash)).toEqual(validDatewithDash)
  })
  it('Correctly parses DD MM YYYY with slashes', () => {
    expect(fromExcelDateToISO(validDDMMYYYYDateWithSlash)).toEqual(validDatewithDash)
  })
  it('Correctly parses DD MM YYYY with dashes', () => {
    expect(fromExcelDateToISO(validDDMMYYYYDateWithDash)).toEqual(validDatewithDash)
  })
  it('Correctly parses unambiguous MM DD YYYY', () => {
    expect(fromExcelDateToISO(unambiguousMMDDYYYYDate)).toEqual(validDatewithDash)
  })
  it('Correctly defaults to DD MM YYYY with ambiguous dates', () => {
    expect(fromExcelDateToISO('06-07-2026')).toEqual('2026-07-06')
  })
  it('returns null for impossible dates', () => {
    expect(fromExcelDateToISO('2026-13-32')).toBe(null)
  })
})

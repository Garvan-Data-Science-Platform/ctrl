const { recordDataOne } = require('./RedCapFetchData/CtrlTestOne')
const { instrumentDataTwo } = require('./RedCapFetchData/CtrlTestTwo')

export const redcapFetch = jest.fn((url, options) => {
  if (url === 'https://redcap.gimr.garvan.org.au/api/' && options.method === 'POST') {
    const params = new URLSearchParams(options.body)

    if (
      params.get('token') === '012745DC3FC14683910C3CCF233DD616' &&
      params.get('content') === 'record' &&
      params.get('format') === 'json' &&
      params.get('form[0]') === 'ctrl_test_1'
    ) {
      return Promise.resolve({ json: () => Promise.resolve(recordDataOne) })
    } else if (
      params.get('token') === '012745DC3FC14683910C3CCF233DD616' &&
      params.get('content') === 'metadata' &&
      params.get('format') === 'json' &&
      params.get('forms[0]') === 'ctrl_test_2'
    ) {
      return Promise.resolve({ json: () => Promise.resolve(instrumentDataTwo) })
    }
  }
  return Promise.resolve({ json: () => Promise.resolve({ data: 100 }) })
}) as jest.Mock

import recordDataOne from './RedCapFetchData/recordDataOne.json'
import instrumentDataTwo from './RedCapFetchData/instrumentDataTwo.json'

export const redcapFetch = jest.fn((url, options) => {
  if (options.method === 'POST') {
    const params = new URLSearchParams(options.body)

    if (params.get('content') === 'record' && params.get('format') === 'json') {
      return Promise.resolve({ json: () => Promise.resolve(recordDataOne) })
    } else if (
      params.get('content') === 'metadata' &&
      params.get('format') === 'json' &&
      params.get('forms[0]') === 'ctrl_test_2'
    ) {
      return Promise.resolve({ json: () => Promise.resolve(instrumentDataTwo) })
    }
  }

  return Promise.resolve({ json: () => Promise.resolve({ data: 'no other case' }) })
}) as jest.Mock

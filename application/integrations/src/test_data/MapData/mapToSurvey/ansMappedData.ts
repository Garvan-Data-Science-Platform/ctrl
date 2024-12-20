export const expectedRadioMapping = [
  {
    data: {
      choices: ['Yes', 'No', 'Not sure'],
      text: 'I would like a summary of the main findings of my genomic testing report securely stored in CTRL, so I can access it at any time.',
      value: 'Yes',
    },
    type: 'question-choices',
  },
]

export const expectedSubheadingMapping = [
  { data: { text: 'test subheading' }, type: 'subheading' },
  {
    data: {
      text: 'I agree to Australian Genomics sharing my contact details with other research projects and clinical trials doing studies I am eligible for.',
      value: false,
    },
    type: 'question-checkbox',
  },
]

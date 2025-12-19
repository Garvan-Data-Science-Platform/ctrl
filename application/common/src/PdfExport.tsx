import { Document, Image, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import { GetParticipantProfileResponse } from '../types/api/users'
import { GetResponsesByIdResponse } from '../types/api/surveys'
import { SurveyElement, SurveyStep } from '../types/survey'

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  section: {
    margin: 10,
    padding: 5,
    flexGrow: 1,
  },
  profileSection: {
    fontSize: 12,
    marginBottom: 10,
    padding: 5,
    borderBottom: '1pt solid #ccc',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  footer: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  table: {
    fontSize: 12,
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
  },
  tableQuestionCell: {
    padding: 5,
    borderWidth: 1,
    borderColor: '#bfbfbf',
    width: '80%',
  },
  tableResponseCell: {
    padding: 5,
    borderWidth: 1,
    borderColor: '#bfbfbf',
    width: '20%',
  },
  tableSubheadingCell: {
    fontWeight: 'bold',
    padding: 5,
    borderWidth: 1,
    borderColor: '#bfbfbf',
    width: '100%',
  },
  headerLogoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  orgLogo: {
    width: 'auto',
    height: '50',
    marginBottom: 10,
  },
  studyLogo: {
    width: 'auto',
    height: '50',
    marginBottom: 10,
  },
})

// Take a response question type and format a table row accordingly
const FormatResponseElement = (element: SurveyElement, mode: 'responses' | 'options') => {
  if (element.type === 'question-checkbox') {
    return (
      <View style={styles.tableRow} wrap={false}>
        <Text style={styles.tableQuestionCell}>
          {element.data.text}{' '}
          {mode == 'options' && element.data.tooltip && `\n\nTooltip: ${element.data.tooltip}`}
        </Text>
        <Text style={styles.tableResponseCell}>
          {mode == 'responses'
            ? element.data.value == null
              ? 'Not answered'
              : element.data.value
                ? 'Yes'
                : 'No'
            : 'Yes / No'}
        </Text>
      </View>
    )
  } else if (element.type === 'question-choices') {
    return (
      <View style={styles.tableRow} wrap={false}>
        <Text style={styles.tableQuestionCell}>
          {element.data.text}{' '}
          {mode == 'options' && element.data.tooltip && `\n\nTooltip: ${element.data.tooltip}`}
        </Text>

        <Text style={styles.tableResponseCell}>
          {mode == 'responses'
            ? element.data.value == null
              ? 'Not answered'
              : element.data.value
            : element.data.choices.join(' / ')}
        </Text>
      </View>
    )
  } else if (element.type === 'subheading') {
    return (
      <View style={styles.tableRow} wrap={false}>
        <Text style={styles.tableSubheadingCell}>{element.data.text}</Text>
      </View>
    )
  } else if (element.type === 'video') {
    return (
      <View style={styles.tableRow} wrap={false}>
        <Text style={styles.tableQuestionCell}>
          <Link href={element.data.link.replace('embed', 'watch')}>Video content</Link>
          <Text>{mode == 'options' && `\n\n${element.data.link}`}</Text>
        </Text>
      </View>
    )
  } else {
    return null
  }
}

interface ResponsesPdfProps {
  studyName: string
  steps: SurveyStep[]
  profile?: GetParticipantProfileResponse['data']
  responses?: GetResponsesByIdResponse
  versionNumber?: number
  orgLogo?: string | null
  studyLogo?: string | null
}

// Create a PDF document component
const ResponsesPdf = ({
  studyName,
  profile,
  steps,
  responses,
  versionNumber,
  orgLogo,
  studyLogo,
}: ResponsesPdfProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.headerLogoContainer}>
        <View>{orgLogo && <Image style={styles.orgLogo} src={orgLogo} />}</View>
        <View>{studyLogo && <Image style={styles.studyLogo} src={studyLogo} />}</View>
      </View>
      <Text style={styles.title}>{studyName}</Text>
      {profile && (
        <Text style={styles.title}>
          Responses for {profile.firstName} {profile.lastName}
        </Text>
      )}
      <View style={styles.profileSection}>
        <Text style={styles.footer}>
          Printed on:{' '}
          {new Date().toLocaleDateString('en-GB', {
            hour: 'numeric',
            minute: '2-digit',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        {versionNumber !== undefined && <Text>V{versionNumber}</Text>}
      </View>
      /* Profile Section */
      {profile && (
        <View style={styles.profileSection}>
          <Text style={styles.subtitle}>Participant Information</Text>
          <Text>
            Date of birth:{' '}
            {new Date(profile.dob).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <Text>Email: {profile.email}</Text>
          <Text>Mobile: {profile.mobile}</Text>
          <Text>Address:</Text>
          <Text>
            {'    '}
            {profile.addressLine}
          </Text>
          <Text>
            {'    '}
            {profile.suburb}
          </Text>
          <Text>
            {'    '}
            {profile.state} {profile.postcode}
          </Text>
        </View>
      )}
      /* Responses Section */
      {steps.map((page) => (
        <View style={styles.section}>
          <Text style={styles.subtitle}>{page.title}</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableQuestionCell}>Question text</Text>
              <Text style={styles.tableResponseCell}>{responses ? 'Response' : 'Options'}</Text>
            </View>
            {page.elements.map((item) =>
              FormatResponseElement(item, responses ? 'responses' : 'options'),
            )}
          </View>
          {responses && (
            <Text style={styles.footer}>
              {page.last_updated
                ? `Reviewed on ${new Date(page.last_updated).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}`
                : 'Not reviewed'}
            </Text>
          )}
        </View>
      ))}
    </Page>
  </Document>
)

export default ResponsesPdf

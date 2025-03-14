import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { GetParticipantProfileResponse } from '@common/types/api/users'
import { GetResponsesByIdResponse } from '@common/types/api/surveys'
import { SurveyElement } from '@common/types/survey'

// TODO pagination

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
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
})

// Take a response question type and format a table row accordingly
const FormatResponseElement = (element: SurveyElement) => {
  if (element.type === 'question-checkbox') {
    return (
      <View style={styles.tableRow}>
        <Text style={styles.tableQuestionCell}>{element.data.text}</Text>
        <Text style={styles.tableResponseCell}>
          {element.data.value == null ? 'Not answered' : element.data.value ? 'Yes' : 'No'}
        </Text>
      </View>
    )
  } else if (element.type === 'question-choices') {
    return (
      <View style={styles.tableRow}>
        <Text style={styles.tableQuestionCell}>{element.data.text}</Text>
        <Text style={styles.tableResponseCell}>
          {element.data.value == null ? 'Not answered' : element.data.value}
        </Text>
      </View>
    )
  } else if (element.type === 'subheading') {
    return (
      <View style={styles.tableRow}>
        <Text>{element.data.text}</Text>
      </View>
    )
  } else if (element.type === 'video') {
    return (
      <View style={styles.tableRow}>
        <Text>Video content</Text>
      </View>
    )
  } else {
    return null
  }
}

interface ResponsesPdfProps {
  profile: GetParticipantProfileResponse
  responses: GetResponsesByIdResponse
}

// Create a PDF document component
const ResponsesPdf = ({ profile, responses }: ResponsesPdfProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>
        Responses for {profile.data.firstName} {profile.data.lastName}
      </Text>
      /* Profile Section */
      <View style={styles.profileSection}>
        <Text style={styles.subtitle}>Participant Information</Text>
        <Text>
          Date of birth:{' '}
          {new Date(profile.data.dob).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <Text>Email: {profile.data.email}</Text>
        <Text>Mobile: {profile.data.mobile}</Text>
        <Text>Address:</Text>
        <Text>
          {'    '}
          {profile.data.addressLine}
        </Text>
        <Text>
          {'    '}
          {profile.data.suburb}
        </Text>
        <Text>
          {'    '}
          {profile.data.state} {profile.data.postcode}
        </Text>
      </View>
      /* Responses Section */
      {responses.data.map((page) => (
        <View style={styles.section}>
          <Text style={styles.subtitle}>{page.title}</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableQuestionCell}>Question text</Text>
              <Text style={styles.tableResponseCell}>Response</Text>
            </View>
            {page.elements.map((item) => FormatResponseElement(item))}
          </View>
          <Text style={styles.footer}>
            {page.last_updated
              ? `Reviewed on ${new Date(page.last_updated).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}`
              : 'Not reviewed'}
          </Text>
        </View>
      ))}
    </Page>
  </Document>
)

export default ResponsesPdf

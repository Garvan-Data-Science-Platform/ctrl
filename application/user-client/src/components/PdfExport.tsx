import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { GetParticipantProfileResponse } from '@common/types/api/users'
import { GetResponsesByIdResponse } from '@common/types/api/surveys'

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  profileSection: {
    marginBottom: 20,
    padding: 10,
    borderBottom: '1pt solid #ccc',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  table: {
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
  tableCell: {
    padding: 5,
    borderWidth: 1,
    borderColor: '#bfbfbf',
    flex: 1,
  },
})

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
        <Text>Date of birth: {profile.data.dob}</Text>
        <Text>Email: {profile.data.email}</Text>
        <Text>Mobile: {profile.data.mobile}</Text>
        <Text>Address:</Text>
        <Text> {profile.data.addressLine}</Text>
        <Text> {profile.data.suburb}</Text>
        <Text>
          {' '}
          {profile.data.state} {profile.data.postcode}
        </Text>
      </View>
      /* Responses Section */
      <View style={styles.section}>
        <Text style={styles.subtitle}>Consent responses</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Question text</Text>
            <Text style={styles.tableCell}>Response</Text>
          </View>
          {responses.data[1].elements.map((item) => (
            // <View style={styles.tableRow} key={item.id}>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.data.text}</Text>
              <Text style={styles.tableCell}>{item.data.value ? 'Yes' : 'No'}</Text>
            </View>
          ))}
        </View>
      </View>
    </Page>
  </Document>
)

export default ResponsesPdf

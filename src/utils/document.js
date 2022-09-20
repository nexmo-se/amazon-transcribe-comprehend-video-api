import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    display: 'flex',
    flexDirection: 'column',
    // justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: 'white',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',

    backgroundColor: 'white',
    padding: 10,
  },
  text: {
    color: '#000000',
  },
});

export const MyDocument = ({ data }) => (
  <Document>
    <Page style={styles.page} size="A4">
      <View style={styles.section}>
        <Image
          src={
            'https://upload.wikimedia.org/wikipedia/commons/5/5a/Vonage_Logo.png'
          }
          // alt="Vonage image"
          style={{
            // objectFit: 'contain',
            maxWidth: '150px',
            maxHeight: '100',
          }}
        />
        <Text
          style={{
            padding: '10px',
          }}
        >
          Captions
        </Text>

        {data?.map((e) => (
          <>
            {/* <li key ={e.text}> */}
            <Text style={{ fontSize: '6px' }}>{e ? e.timestamp : null}</Text>
            <Text style={{ color: '#3388af', fontSize: '12px', margin: '6px' }}>
              {data ? `${e.speaker} : ${e.text}` : '...'}
            </Text>
            {/* <li/> */}
          </>
        ))}
      </View>
    </Page>
  </Document>
);

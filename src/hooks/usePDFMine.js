import { useState, useEffect, useCallback } from 'react';
import {
  usePDF,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { MyDocument } from '../utils/document';

export function usePDFMine() {
  const [captions, setCaptions] = useState(null);
  const document = <MyDocument data={captions} />;
  const [instance, update] = usePDF({ document: document });

  const styles = StyleSheet.create({
    page: {
      flexDirection: 'row',
      backgroundColor: '#E4E4E4',
    },
    section: {
      margin: 10,
      padding: 10,
      flexGrow: 1,
    },
    text: {
      color: '#000000',
    },
  });

  const MyDocuments = ({ captiones }) => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text>{captions}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.text}>
            Section #2 Lorem, ipsum dolor sit amet consectetur adipisicing elit.
            Natus debitis perferendis exercitationem nesciunt, dolorem pariatur?
            Iste beatae, ullam modi, maxime asperiores aspernatur totam
            voluptatibus quod perferendis laborum doloremque vero consequatur.
          </Text>
        </View>
      </Page>
    </Document>
  );

  return { MyDocuments, captions };
}

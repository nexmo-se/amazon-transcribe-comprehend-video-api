import { useState, useCallback, useEffect, useContext } from 'react';
// import { Message } from '../entities/ChatMessage';
// import { UserContext } from '../context/UserContext';
import { v4 as uuid } from 'uuid';

export function useSignalling({ session }) {
  const [messages, setMessages] = useState(null);
  const [entities, setEntities] = useState(null);
  const [archiveId, setArchiveId] = useState(null);
  const [renderedSesion, setRenderedSession] = useState(null);
  const [medication, setMedicationEntities] = useState([]);
  const [medicalContitions, setMedicalConditionsEntities] = useState([]);
  //   const { user } = useContext(UserContext);

  const signal = useCallback(
    async ({ type, data }) => {
      return new Promise((resolve, reject) => {
        const payload = JSON.parse(JSON.stringify({ type, data }));
        if (session) {
          session.signal(payload, (err) => {
            if (err) reject(err);
            else resolve();
          });
        }
      });
    },
    [session]
  );

  const archiveListener = useCallback(({ data }) => {
    console.log(data);
    const archiveId = data.split(':')[0];
    const sessionRendered = data.split(':')[1];
    setArchiveId(archiveId);
    setRenderedSession(sessionRendered);
  }, []);

  const sendMessage = useCallback(
    (message) => {
      return signal({ type: 'message', data: message });
    },
    [signal]
  );

  useEffect(() => {
    if (medicalContitions) console.log(medicalContitions);
    if (medication) console.log(medication);
  }, [medicalContitions, medication]);

  const entitiesListener = useCallback(({ data, from }) => {
    const dataJson = JSON.parse(data);
    if (dataJson.length) {
      dataJson.forEach((entity) => {
        if (entity.Category === 'MEDICAL_CONDITION')
          // setMedicalConditionsEntities(entity.Text);
          setMedicalConditionsEntities((prev) => [...prev, entity.Text]);
        if (entity.Category === 'MEDICATION')
          // setMedicationEntities(entity.Text);
          setMedicationEntities((prev) => [...prev, entity.Text]);
      });
    }
  }, []);

  const messageListener = useCallback(({ data, from }) => {
    console.log('received message');
    console.log(data);
    setMessages(data);
  }, []);

  useEffect(() => {
    if (session) {
      session.on('signal:captions', messageListener);
      session.on('signal:medicalEntities', entitiesListener);
      session.on('signal:archiveStarted', archiveListener);
    }
    return function cleanup() {
      if (session) {
        session.off('signal:captions', messageListener);
        session.off('signal:archiveStarted', archiveListener);
        session.off('signal:medicalEntities', entitiesListener);
      }
    };
  }, [session, messageListener, archiveListener, entitiesListener]);

  return {
    sendMessage,
    messages,
    archiveId,
    renderedSesion,
    medicalContitions,
    medication,
  };
}

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
  const [medicalConditions, setMedicalConditionsEntities] = useState([]);
  const [anatomyEntities, setAnatomyEntities] = useState([]);
  const [piiEntities, setPiiEntities] = useState([]);
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

  // useEffect(() => {
  //   if (medicalConditions) console.log(medicalConditions);
  //   if (medication) console.log(medication);
  // }, [medicalContitions, medication]);

  const medicationListener = useCallback(({ data, from }) => {
    const dataJson = JSON.parse(data);
    // const medString = `${dataJson[0].Description} | ${dataJson[0].Code}`;
    // setMedicationEntities((prev) => [...prev, medString]);
    //console.log(dataJson)
    if (dataJson.length) {
      dataJson.forEach((entity) => {
        setMedicationEntities((prev) => [...prev, {
          Text: `${entity.Text} | ${entity.Score}`, 
          concepts: entity.RxNormConcepts? entity.RxNormConcepts : []
        }]);
      })
    }
  }, []);

  const medConditionListener = useCallback(({ data, from }) => {
    const dataJson = JSON.parse(data);
    // const medString = `${dataJson[0].Description} | ${dataJson[0].Code}`;
    // setMedicalConditionsEntities((prev) => [...prev, medString]);
    if (dataJson.length) {
      dataJson.forEach((entity) => {
        setMedicalConditionsEntities((prev) => [...prev, {
          Text: `${entity.Text} | ${entity.Score}`, 
          concepts: entity.ICD10CMConcepts? entity.ICD10CMConcepts : []
        }]);
      })
    }
  }, []);

  const entitiesListener = useCallback(({ data, from }) => {
    const dataJson = JSON.parse(data);
    if (dataJson.length) {
      dataJson.forEach((entity) => {
        if (entity?.Category === 'ANATOMY')
          setAnatomyEntities((prev) => [...prev, entity]);

        if (entity?.Category === 'PROTECTED_HEALTH_INFORMATION')
          setPiiEntities((prev) => [...prev, entity]);
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
      session.on('signal:medication', medicationListener);
      session.on('signal:medCondition', medConditionListener);
    }
    return function cleanup() {
      if (session) {
        session.off('signal:captions', messageListener);
        session.off('signal:archiveStarted', archiveListener);
        session.off('signal:medicalEntities', entitiesListener);
        session.off('signal:medication', medicationListener);
        session.off('signal:medCondition', medicationListener);
      }
    };
  }, [
    session,
    messageListener,
    archiveListener,
    entitiesListener,
    medicationListener,
    medConditionListener,
  ]);

  return {
    sendMessage,
    messages,
    archiveId,
    renderedSesion,
    medicalConditions,
    medication,
    piiEntities,
    anatomyEntities,
  };
}

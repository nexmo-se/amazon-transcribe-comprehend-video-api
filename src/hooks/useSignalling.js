import { useState, useCallback, useEffect, useContext } from 'react';
// import { Message } from '../entities/ChatMessage';
// import { UserContext } from '../context/UserContext';
import { v4 as uuid } from 'uuid';
import { usePDFMine } from './usePDFMine';

export function useSignalling({ session }) {
  const [messages, setMessages] = useState(null);
  const [entities, setEntities] = useState(null);
  const [archiveId, setArchiveId] = useState(null);
  const [renderedSesion, setRenderedSession] = useState(null);
  const [medication, setMedicationEntities] = useState([]);
  const [medicalConditions, setMedicalConditionsEntities] = useState([]);
  const [anatomyEntities, setAnatomyEntities] = useState([]);
  const [piiEntities, setPiiEntities] = useState([]);
  const [ttpEntities, setTtpEntities] = useState([]);
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

  const medicationListener = useCallback(({ data, from }) => {
    const dataJson = JSON.parse(data);
    // const medString = `${dataJson[0].Description} | ${dataJson[0].Code}`;
    // setMedicationEntities((prev) => [...prev, medString]);
    //console.log(dataJson)
    if (dataJson.length) {
      dataJson.forEach((entity) => {
        if (entity?.Category === 'MEDICATION') {
          setMedicationEntities((prev) => [
            {
              Text: `${entity.Text} | ${
                Math.floor(entity.Score * 10000) / 100
              }%`,
              concepts: entity.RxNormConcepts ? entity.RxNormConcepts : [],
            },
            ...prev,
          ]);
        }
      });
    }
  }, []);

  const medConditionListener = useCallback(({ data, from }) => {
    const dataJson = JSON.parse(data);
    // const medString = `${dataJson[0].Description} | ${dataJson[0].Code}`;
    // setMedicalConditionsEntities((prev) => [...prev, medString]);
    if (dataJson.length) {
      dataJson.forEach((entity) => {
        if (entity?.Category === 'MEDICAL_CONDITION') {
          setMedicalConditionsEntities((prev) => [
            {
              Text: `${entity.Text} | ${
                Math.floor(entity.Score * 10000) / 100
              }%`,
              concepts: entity.ICD10CMConcepts ? entity.ICD10CMConcepts : [],
            },
            ...prev,
          ]);
        }
      });
    }
  }, []);

  const entitiesListener = useCallback(({ data, from }) => {
    const dataJson = JSON.parse(data);
    if (dataJson.length) {
      dataJson.forEach((entity) => {
        if (entity?.Category === 'ANATOMY')
          setAnatomyEntities((prev) => [
            {
              Text: `${entity.Type} | ${entity.Text}`,
            },
            ...prev,
          ]);

        if (entity?.Category === 'PROTECTED_HEALTH_INFORMATION')
          setPiiEntities((prev) => [
            {
              Text: `${entity.Type} | ${entity.Text}`,
            },
            ...prev,
          ]);

        if (entity?.Category === 'TEST_TREATMENT_PROCEDURE') {
          var attribute =
            entity.Attributes && entity.Attributes[0]
              ? ' | ' + entity.Attributes[0].Text
              : '';
          setTtpEntities((prev) => [
            {
              Text: entity.Text + attribute,
            },
            ...prev,
          ]);
        }
      });
    }
  }, []);

  const messageListener = useCallback(({ data, from }) => {
    console.log('received message');
    console.log(JSON.stringify(data));
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
    ttpEntities,
  };
}

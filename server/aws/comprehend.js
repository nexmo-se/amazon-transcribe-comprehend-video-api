const opentok = require('../opentok/opentok');

const { ComprehendMedical } = require('aws-sdk');
const marshaller = require('@aws-sdk/eventstream-marshaller');
const util_utf8_node = require('@aws-sdk/util-utf8-node');
const eventStreamMarshaller = new marshaller.EventStreamMarshaller(
  util_utf8_node.toUtf8,
  util_utf8_node.fromUtf8
);
const comprehendMedical = new ComprehendMedical({ region: 'us-west-2' });

const getEntities = async (text) => {
  if (text === undefined || text.replace(/\s/g, '') === '') return [];

  const resp = await comprehendMedical
    .detectEntitiesV2({ Text: text })
    .promise();
  console.log(resp.Entities);
  return resp.Entities;
};

const detectRxNorm = async (text) => {
  if (text === undefined || text.replace(/\s/g, '') === '') return [];

  const resp = await comprehendMedical.inferRxNorm({ Text: text }).promise();
  return resp.Entities;
};

const detectICD10CM = async (text) => {
  if (text === undefined || text.replace(/\s/g, '') === '') return [];

  const resp = await comprehendMedical.inferICD10CM({ Text: text }).promise();
  return resp.Entities;
};

const getRoomFromUrl = (ws) => {
  const searchParams = new URLSearchParams(ws);
  return searchParams.get('room');
};

//// Credentials should move to envs or use iam role

const print_result = async (message) => {
  const wsUrl = message.target._url;
  const streamId = message.target.uuid;
  const sessionToSignal = message.target.sessionId;
  //const room = getRoomFromUrl(wsUrl);
  //const sessionToSignal = sessions[room].session;

  let messageWrapper = eventStreamMarshaller.unmarshall(
    Buffer.from(message.data)
  );
  let messageBody = JSON.parse(
    String.fromCharCode.apply(String, messageWrapper.body)
  );
  const Results = (messageBody?.Transcript?.Results ?? []).length
    ? messageBody.Transcript.Results[0]
    : null;

  if (Results && Results.IsPartial) {
  } else if (Results && !Results.IsPartial) {
    console.log(Results);
    try {
      opentok.signal(
        sessionToSignal,
        Results.Alternatives[0].Transcript,
        'captions'
      );
      const medEntities = await getEntities(Results.Alternatives[0].Transcript);
      if (medEntities) {
        if (
          medEntities[0]?.Category === 'ANATOMY' ||
          medEntities[0]?.Category === 'PROTECTED_HEALTH_INFORMATION'
        ) {
          const medEntitiesString = JSON.stringify(medEntities);

          opentok.signal(sessionToSignal, medEntitiesString, 'medicalEntities');
        }

        // const medEntitiesString = JSON.stringify(medEntities);
        // console.log(medEntitiesString);
        const rxNorm = await detectRxNorm(Results.Alternatives[0].Transcript);
        const ICD10CM = await detectICD10CM(Results.Alternatives[0].Transcript);
        if (rxNorm[0]?.RxNormConcepts) {
          const rxString = JSON.stringify(rxNorm[0]?.RxNormConcepts);
          console.log(rxNorm[0].RxNormConcepts);
          opentok.signal(sessionToSignal, rxString, 'medication');
        }
        if (ICD10CM[0]?.ICD10CMConcepts) {
          const ICD10CMString = JSON.stringify(ICD10CM[0]?.ICD10CMConcepts);
          opentok.signal(sessionToSignal, ICD10CMString, 'medCondition');
        }
      }
    } catch (e) {
      console.log(e);
    }

    // opentok.signal(sessionToSignal, Results.Alternatives[0].Transcript);
  }
};

module.exports = {
  print_result,
};

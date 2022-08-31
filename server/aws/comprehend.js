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
  //console.log('inferRxNorm', resp.Entities);
  if (resp.Entities && resp.Entities.length) {
    const entities = sortConcepts(resp.Entities, 'RxNormConcepts');
    return entities
  }
  else return resp.Entities;
};

const detectICD10CM = async (text) => {
  if (text === undefined || text.replace(/\s/g, '') === '') return [];

  const resp = await comprehendMedical.inferICD10CM({ Text: text }).promise();
  //console.log('inferICD10CM', resp.Entities);
  if (resp.Entities && resp.Entities.length) {
    const entities = sortConcepts(resp.Entities, 'ICD10CMConcepts');
    return entities
  }
  else return resp.Entities;
};

const detectSNOMEDCT = async(text) => {
  if (text === undefined || text.replace(/\s/g, '') === '') return [];

  const resp = await comprehendMedical.inferSNOMEDCT({ Text: text }).promise();
  console.log('inferSNOMEDCT', resp.Entities);
  if (resp.Entities && resp.Entities.length) {
    const entities = sortConcepts(resp.Entities, 'SNOMEDCTConcepts');
    return entities
  }
  else return resp.Entities;
}

const sortConcepts = (rawEntities, conceptAttribute) => rawEntities.map((entity) => {
    if (entity[conceptAttribute].length === 0) return entity;
    const sortedConcepts = sortByScoreDescending(entity[conceptAttribute]);
    return { ...entity, [conceptAttribute]: sortedConcepts };
  });

const sortByScoreDescending = (concepts) => [...concepts].sort((concept1, concept2) => concept2.Score - concept1.Score);

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

        const rxNorm = await detectRxNorm(Results.Alternatives[0].Transcript);
        if (rxNorm && rxNorm[0]?.RxNormConcepts) {
          //const rxString = JSON.stringify(rxNorm[0]?.RxNormConcepts);
          //opentok.signal(sessionToSignal, rxString, 'medication');
          //
          opentok.signal(sessionToSignal, JSON.stringify(rxNorm), 'medication');
        }

        const ICD10CM = await detectICD10CM(Results.Alternatives[0].Transcript);
        if (ICD10CM && ICD10CM[0]?.ICD10CMConcepts) {
          //const ICD10CMString = JSON.stringify(ICD10CM[0]?.ICD10CMConcepts);
          //opentok.signal(sessionToSignal, ICD10CMString, 'medCondition');
          //
          opentok.signal(sessionToSignal, JSON.stringify(ICD10CM), 'medCondition');
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

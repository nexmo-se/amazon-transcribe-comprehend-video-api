'use strict';

const path = require('path');
let env = process.env.NODE_ENV || 'development';
console.log(env);
const envPath = path.join(__dirname, '..');
console.log('envPath', envPath);
require('dotenv').config({ path: `${envPath}/.env.${env}` });

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const expressWs = require('express-ws')(app);
// const { createWriteStream, readFileSync } = require('fs');
// const { Readable } = require('stream');
// const websocketStream = require('websocket-stream');
// const Transform = require('stream').Transform;
const opentok = require('./opentok/opentok');
const transcribe = require('./aws/transcribe');
const comprehend = require('./aws/comprehend');

// const {
//   ComprehendMedicalClient,
//   DescribeEntitiesDetectionV2JobCommand,
// } = require('@aws-sdk/client-comprehendmedical');
// const { ComprehendMedical } = require('aws-sdk');

// const marshaller = require('@aws-sdk/eventstream-marshaller');
// const util_utf8_node = require('@aws-sdk/util-utf8-node');
// const eventStreamMarshaller = new marshaller.EventStreamMarshaller(
//   util_utf8_node.toUtf8,
//   util_utf8_node.fromUtf8
// );

// const {
//   TranscribeStreamingClient,
//   StartStreamTranscriptionCommand,
// } = require('@aws-sdk/client-transcribe-streaming');
// const comprehendClient = new ComprehendMedicalClient({ region: 'us-west-2' });
// const comprehendMedical = new ComprehendMedical({ region: 'us-west-2' });

app.use(cors());
app.use(bodyParser.json());
let sessions = [];

// app.use(express.static('public'));

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,PUT,DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With'
  );
  next();
});

app.get('/session/:room', async (req, res) => {
  try {
    const { room: roomName } = req.params;
    // start_transcription(roomName);
    // const localId = userId++;
    const role = req.query.role !== undefined ? req.query.role : 'test';
    if (sessions[roomName]) {
      const data = opentok.generateToken(sessions[roomName].session, role);
      app.set('roomName-' + sessions[roomName].session, roomName);
      res.json({
        sessionId: sessions[roomName].session,
        token: data.token,
        apiKey: data.apiKey,
        // userId: localId,
      });
    } else {
      const data = await opentok.getCredentials(null, role);
      sessions[roomName] = {
        session: data.sessionId,
        users: [],
        connectionCount: 0,
      };
      app.set('roomName-' + sessions[roomName].session, roomName);
      res.json({
        sessionId: data.sessionId,
        token: data.token,
        apiKey: data.apiKey,
        // userId: localId,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
});

app.post('/startStreaming', async (req, res) => {
  try {
    console.log('someone wants to stream');
    const { streamId, sessionId } = req.body;
    console.log(streamId, sessionId);
    
    var roomName = app.get('roomName-' + sessionId);
    console.log(`start_transcription: room[${roomName}]`);
    await transcribe.start_transcription({
      roomName,
      sessionId, 
      streamId
    }, comprehend.print_result);

    const response = await opentok.startStreamer(streamId, sessionId);
    res.send(response);
  } catch (e) {
    console.log(e);
  }
});

app.ws('/socket', async (ws, req) => {
  console.log('someone connected');

  var fromStreamId = null;
  ws.on('message', (msg) => {
    try {
      if (typeof msg === 'string') {
        let config = JSON.parse(msg);
        console.log(config);
        fromStreamId = config.from;
      } else {
        transcribe.aws_socket_send(msg, fromStreamId);
      }
    } catch (err) {
      ws.removeAllListeners('message');
      ws.close();
    }
  });

  ws.on('close', () => {
    console.log('[' + '] Websocket closed');
  });
});

if (env === 'production') {
  console.log('Setting Up express.static for production env');
  const buildPath = path.join(__dirname, '..', 'build');
  app.use(express.static(buildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
  });
}

const port = process.env.SERVER_PORT || 5001;
app.listen(port, () =>
  console.log(`Server application listening on port ${port}!`)
);

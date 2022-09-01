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

const opentok = require('./opentok/opentok');
const transcribe = require('./aws/transcribe');
const comprehend = require('./aws/comprehend');

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
    const { streamId, sessionId, streamName, specialty } = req.body;
    const roomName = app.get('roomName-' + sessionId);
    console.log(roomName, specialty, streamName, streamId, sessionId);

    await transcribe.start_transcription({
      roomName,
      sessionId, 
      streamId, 
      streamName, 
      specialty
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

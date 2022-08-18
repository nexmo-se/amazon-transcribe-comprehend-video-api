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
const { createWriteStream, readFileSync } = require('fs');
const expressWs = require('express-ws')(app);
const axios = require('axios');
const { Readable } = require('stream');
const jwt = require('jsonwebtoken');
const websocketStream = require('websocket-stream');
const Transform = require('stream').Transform;
const crypto = require('crypto');
const opentok = require('./opentok/opentok');
const v4 = require('./aws-signature-v4.js');
const WebSocket = require('ws');
const {
  ComprehendMedicalClient,
  DescribeEntitiesDetectionV2JobCommand,
} = require('@aws-sdk/client-comprehendmedical');
const { ComprehendMedical } = require('aws-sdk');

const marshaller = require('@aws-sdk/eventstream-marshaller');
const util_utf8_node = require('@aws-sdk/util-utf8-node');
const eventStreamMarshaller = new marshaller.EventStreamMarshaller(
  util_utf8_node.toUtf8,
  util_utf8_node.fromUtf8
);
const awsRegion = 'us-west-2';
const {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
} = require('@aws-sdk/client-transcribe-streaming');
const comprehendClient = new ComprehendMedicalClient({ region: 'us-west-2' });
const comprehendMedical = new ComprehendMedical({ region: 'us-west-2' });
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
    start_transcription(roomName);
    // const localId = userId++;
    const role = req.query.role !== undefined ? req.query.role : 'test';
    if (sessions[roomName]) {
      const data = opentok.generateToken(sessions[roomName].session, role);
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
    const response = await startStreamer(streamId, sessionId);
    res.send(response);
  } catch (e) {
    console.log(e);
  }
});

const getEntities = async (text) => {
  if (text === undefined || text.replace(/\s/g, '') === '') return [];

  const resp = await comprehendMedical
    .detectEntitiesV2({ Text: text })
    .promise();
  console.log(resp.Entities);
  return resp.Entities;
};

const start_transcription = async (roomName) => {
  try {
    const url = create_presigned_url(roomName);

    await connect_to_transcribe_web_socket(url);
  } catch (e) {
    console.log(e);
  }
  // start_listener_socket();
};

app.ws('/socket', async (ws, req) => {
  console.log('someone connected');

  ws.on('message', (msg) => {
    try {
      if (typeof msg === 'string') {
        let config = JSON.parse(msg);
        console.log(config);
      } else {
        const binary = convert_audio_to_binary_message(msg);
        aws_socket.send(binary);
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

const getRoomFromUrl = (ws) => {
  const searchParams = new URLSearchParams(ws);
  return searchParams.get('room');
};

const generateRestToken = () => {
  return new Promise((res, rej) => {
    jwt.sign(
      {
        iss: process.env.VIDEO_API_API_KEY,
        // iat: Date.now(),
        ist: 'project',
        exp: Date.now() + 200,
        jti: Math.random() * 132,
      },
      process.env.VIDEO_API_API_SECRET,
      { algorithm: 'HS256' },
      function (err, token) {
        if (token) {
          console.log('\n Received token\n', token);
          res(token);
        } else {
          console.log('\n Unable to fetch token, error:', err);
          rej(err);
        }
      }
    );
  });
};

const startStreamer = async (streamId, sessionId) => {
  try {
    const { token } = await opentok.generateToken(sessionId, 'publisher');

    const data = JSON.stringify({
      sessionId: sessionId,
      token: token,
      websocket: {
        uri: `${process.env.websocket_url}/socket`,
        streams: [streamId],
        headers: {
          from: streamId,
        },
      },
    });
    const config = {
      method: 'post',
      url: `https://api.opentok.com/v2/project/${process.env.VIDEO_API_API_KEY}/connect`,
      headers: {
        'X-OPENTOK-AUTH': await generateRestToken(),
        'Content-Type': 'application/json',
      },
      data: data,
    };
    const response = await axios(config);
    console.log(response.data);
    return response.data;
  } catch (e) {
    console.log(e);
    return e;
  }
};

const convert_audio_to_binary_message = (audioChunk) => {
  let audioEventMessage = {
    headers: {
      ':content-type': {
        type: 'string',
        value: 'application/octet-stream',
      },
      ':event-type': {
        type: 'string',
        value: 'AudioEvent',
      },
      ':message-type': {
        type: 'string',
        value: 'event',
      },
    },
    body: audioChunk,
  };

  return eventStreamMarshaller.marshall(audioEventMessage);
};

var aws_socket;

//// Credentials should move to envs or use iam role

function connect_to_transcribe_web_socket(presignedUrl) {
  console.log('Opening WS Connection', presignedUrl);

  return new Promise((resolve) => {
    aws_socket = new WebSocket(presignedUrl);

    aws_socket.binaryType = 'arraybuffer';

    aws_socket.on('open', function () {
      console.log('WS Connection Open');

      aws_socket.onmessage = function (message) {
        print_result(message);
      };

      aws_socket.onerror = function (event) {
        console.log('WS Error', event);
      };

      aws_socket.onclose = function (event) {
        console.log('WS Close', event.target);
      };

      resolve();
    });
  });
}

function create_presigned_url(room) {
  let endpoint = 'transcribestreaming.' + awsRegion + '.amazonaws.com:8443';

  return v4.createPresignedURL(
    'GET',
    endpoint,
    '/medical-stream-transcription-websocket',
    'transcribe',
    crypto.createHash('sha256').update('', 'utf8').digest('hex'),
    {
      key: process.env.AccessKeyId,
      secret: process.env.SecretAccessKey,
      region: 'us-west-2',
      protocol: 'wss',
      expires: 300,
      query: `language-code=en-US&media-encoding=pcm&sample-rate=16000&room=${room}&specialty=PRIMARYCARE&type=DICTATION`,
    }
  );
}

const print_result = async (message) => {
  const wsUrl = message.target._url;
  const room = getRoomFromUrl(wsUrl);
  const sessionToSignal = sessions[room].session;

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
    // console.log(Results);
    // console.log(Results.Alternatives[0].Transcript);
    // getEntities(Results.Alternatives[0].Transcript);
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
        const medEntitiesString = JSON.stringify(medEntities);
        console.log(medEntitiesString);
        opentok.signal(sessionToSignal, medEntitiesString, 'medicalEntities');
      }
    } catch (e) {
      console.log(e);
    }

    // opentok.signal(sessionToSignal, Results.Alternatives[0].Transcript);
  }
};

if (env === 'production') {
  console.log('Setting Up express.static for production env');
  const buildPath = path.join(__dirname, '..', 'build');
  app.use(express.static(buildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
  });
}

const port = process.env.PORT || 5001;
app.listen(port, () =>
  console.log(`Server application listening on port ${port}!`)
);

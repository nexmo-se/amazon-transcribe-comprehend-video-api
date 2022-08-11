'use strict';
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const { createWriteStream, readFileSync } = require('fs');
const expressWs = require('express-ws')(app);
const axios = require('axios');
const { Readable } = require('stream');
const jwt = require('jsonwebtoken');
const websocketStream = require('websocket-stream');
const Transform = require('stream').Transform;
const crypto = require('crypto');
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

// fileBuf.on('error', function (err) {
//   console.log(err);
// });

app.use(bodyParser.json());
app.use(express.static('public'));

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

// const client = new TranscribeStreamingClient({
//   region: 'us-west-2',
//   //   credentials,
// });

app.post('/startStreaming', async (req, res) => {
  try {
    console.log('someone wants to stream');
    const streamId = req.body.streamId;
    // console.log(streamId);
    const response = await startStreamer(streamId);
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
  // return resp.Entities;
};

// async function handleResponse(response) {
//   for await (const event of response.TranscriptResultStream) {
//     if (event.TranscriptEvent) {
//       const message = event.TranscriptEvent;
//       // Get multiple possible results
//       const results = event.TranscriptEvent.Transcript.Results;
//       // Print all the possible transcripts
//       results.map((result) => {
//         (result.Alternatives || []).map((alternative) => {
//           const transcript = alternative.Items.map((item) => item.Content).join(
//             ' '
//           );
//           console.log(transcript);
//         });
//       });
//     }
//   }
// }

const start_transcription = async () => {
  try {
    const url = create_presigned_url();

    await connect_to_transcribe_web_socket(url);
  } catch (e) {
    console.log(e);
  }
  // start_listener_socket();
};

start_transcription();

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

        // start();
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

// function wait(time) {
//   return new Promise((resolve) => {
//     setTimeout(resolve, time);
//   });
// }

// async function* audioSource() {
//   const chunkSize = 10 * 1000;

//   let index = 0;
//   let i = 0;
//   while (index < fileBuf.length) {
//     // while(index < chunkSize * 60) {
//     const chunk = fileBuf.slice(
//       index,
//       Math.min(index + chunkSize, fileBuf.byteLength)
//     );
//     await wait(300);
//     yield chunk;
//     console.log(chunk);
//     index += chunkSize;
//   }
// }

// async function* audioStream() {
//   for await (const chunk of audioSource()) {
//     yield { AudioEvent: { AudioChunk: chunk } };
//   }
// }

// async function start() {
//   const command = new StartStreamTranscriptionCommand({
//     LanguageCode: 'en-US',
//     MediaSampleRateHertz: 16000,
//     MediaEncoding: 'pcm',
//     AudioStream: audioStream(),
//     // Specialty: Specialty.CARDIOLOGY,
//     // Type: Type.CONVERSATION
//   });
//   try {
//     const data = await client.send(command);
//     // console.log(data.TranscriptResultStream)
//     for await (const event of data.TranscriptResultStream) {
//       if (event.TranscriptEvent) {
//         const results = event.TranscriptEvent.Transcript.Results;
//         results.map((result) => {
//           console.log(result.Alternatives);
//           (result.Alternatives || []).map((alternative) => {
//             const str = alternative.Items.map((item) => item.Content).join(' ');
//             console.log(str);
//           });
//         });
//       }
//     }
//     // console.log('DONE', data);
//     client.destroy();
//   } catch (e) {
//     console.log('ERROR: ', e);
//     process.exit(1);
//   }
// }

const generateRestToken = () => {
  return new Promise((res, rej) => {
    jwt.sign(
      {
        iss: process.env.apiKey,
        // iat: Date.now(),
        ist: 'project',
        exp: Date.now() + 200,
        jti: Math.random() * 132,
      },
      process.env.apiSecret,
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

const startStreamer = async (streamId) => {
  try {
    // const { sessionId, token, apiKey } = await getCredentials();

    const data = JSON.stringify({
      sessionId: process.env.sessionId,
      token: process.env.token,
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
      url: `https://api.opentok.com/v2/project/${process.env.apiKey}/connect`,
      headers: {
        'X-OPENTOK-AUTH': await generateRestToken(),
        'Content-Type': 'application/json',
      },
      data: data,
    };
    // console.log(config);
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

function create_presigned_url() {
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
      query:
        'language-code=en-US&media-encoding=pcm&sample-rate=16000&specialty=PRIMARYCARE&type=DICTATION',
    }
  );
}

const print_result = (message) => {
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
  }
};

const port = process.env.PORT || 5000;
app.listen(port, () =>
  console.log(`Server application listening on port ${port}!`)
);
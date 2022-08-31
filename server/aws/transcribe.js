const WebSocket = require('ws');
const crypto = require('crypto');
const v4 = require('./aws-signature-v4.js');
const marshaller = require('@aws-sdk/eventstream-marshaller');
const util_utf8_node = require('@aws-sdk/util-utf8-node');
const eventStreamMarshaller = new marshaller.EventStreamMarshaller(
  util_utf8_node.toUtf8,
  util_utf8_node.fromUtf8
);

const aws_sockets = new Map();

const awsRegion = 'us-west-2';

function create_presigned_url(room, specialty) {
  let endpoint = 'transcribestreaming.' + awsRegion + '.amazonaws.com:8443';
  specialty = specialty? specialty: 'PRIMARYCARE';
  
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
      query: `language-code=en-US&media-encoding=pcm&sample-rate=16000&room=${room}&specialty=${specialty}&type=DICTATION`,
    }
  );
}

async function connect_to_transcribe_web_socket(presignedUrl, {sessionId, streamId}, handleMessage) {
  console.log('Opening WS Connection', presignedUrl);

  try {
    const aws_socket = new WebSocket(presignedUrl);

    aws_socket.binaryType = 'arraybuffer';
    aws_socket.uuid = streamId;
    aws_socket.sessionId = sessionId;

    aws_socket.onopen = function () {
      console.log('WS Connection Open');
      aws_sockets.set(aws_socket.uuid, aws_socket);
    };

    aws_socket.onmessage = function (message) {
      handleMessage(message);
      // comprehend.print_result
    };

    aws_socket.onerror = function ({ target, reason, code }) {
      console.log('WS Error', target.uuid, reason, code);
      aws_sockets.has(target.uuid) && aws_sockets.delete(target.uuid);
    };

    aws_socket.onclose = function ({ target, reason, code }) {
      console.log('WS Close', target.uuid, reason, code);
      aws_sockets.has(target.uuid) && aws_sockets.delete(target.uuid);
    };

    return Promise.resolve(aws_socket);
  } catch (e) {
    console.log(e)
    return Promise.reject(e.message);
  }
}

const start_transcription = async ({roomName, sessionId, streamId, specialty}, handleMessage) => {
  try {
    const url = create_presigned_url(roomName, specialty);

    await connect_to_transcribe_web_socket(url, {sessionId, streamId}, handleMessage);
  } catch (e) {
    console.log(e);
  }
  // start_listener_socket();
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

const aws_socket_send = (msg, fromStreamId) => {
  try {
    if (!fromStreamId) return;

    const aws_socket = aws_sockets.get(fromStreamId);
    if (!aws_socket || aws_socket.readyState !== WebSocket.OPEN) {
      //console.log('aws_socket_send did not send', aws_socket);
      return;
    }
    const binary = convert_audio_to_binary_message(msg);
    aws_socket.send(binary);
  } catch (e) {
    console.log(e)
  }
}

module.exports = {
    aws_sockets,
    start_transcription,
    aws_socket_send
}
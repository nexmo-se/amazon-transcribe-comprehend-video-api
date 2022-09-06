const OpenTok = require('opentok');
const apiKey = process.env.VIDEO_API_API_KEY;
const apiSecret = process.env.VIDEO_API_API_SECRET;

const axios = require('axios');
const jwt = require('jsonwebtoken');
if (!apiKey || !apiSecret) {
  throw new Error(
    'Missing config values for env params OT_API_KEY and OT_API_SECRET'
  );
}
let sessionId;

const opentok = new OpenTok(apiKey, apiSecret);

const createSessionandToken = (session, role) => {
  return new Promise((resolve, reject) => {
    opentok.createSession({ mediaMode: 'routed' }, function (error, session) {
      if (error) {
        reject(error);
      } else {
        sessionId = session.sessionId;
        const token = role
          ? opentok.generateToken(sessionId, { data: role })
          : opentok.generateToken(sessionId);
        resolve({ sessionId: sessionId, token: token });
        //console.log("Session ID: " + sessionId);
      }
    });
  });
};

const signal = (sessionId, captions, type) => {
  return new Promise((res, rej) => {
    console.log(JSON.stringify(captions), 'being sent');
    opentok.signal(
      sessionId,
      null,
      { type: type, data: captions },
      (err, resp) => {
        if (!err) {
          res(resp);
        } else {
          console.log(err);
          rej(err);
        }
      }
    );
  });
};

const createArchive = (session) => {
  console.log('Creating archive');
  return new Promise((resolve, reject) => {
    opentok.startArchive(
      session,
      {
        resolution: '1280x720',
        streamMode: 'manual',
      },
      function (error, archive) {
        if (error) {
          reject(error);
          console.log(error);
        } else {
          resolve(archive);
        }
      }
    );
  });
};

const addStreamToArchive = (archiveId, streamId) => {
  return new Promise((res, rej) => {
    opentok.addArchiveStream(archiveId, streamId, {}, (err, resp) => {
      if (err) rej(err);
      else res(resp);
    });
  });
};

const stopArchive = (archive) => {
  return new Promise((resolve, reject) => {
    opentok.stopArchive(archive, function (error, session) {
      if (error) {
        reject(error);
      } else {
        resolve(archive);
      }
    });
  });
};

const generateRestToken = () => {
  return new Promise((res, rej) => {
    jwt.sign(
      {
        iss: process.env.VIDEO_API_API_KEY,
        // iat: Date.now(),
        ist: 'project',
        exp: Date.now() + 200,
        // exp: 1658483742,
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

const createRender = async (roomName, sessionId) => {
  try {
    // const { token, apiKey } = await getCredentials(sessionId);
    const { token } = generateToken(sessionId, 'EC');
    const data = JSON.stringify({
      url: `${process.env.REACT_APP_API_URL_PRODUCTION}/videorti/recorder/${roomName}`,
      sessionId: sessionId,
      token: token,
      projectId: apiKey,
      maxDuration: 300,
      statusCallbackUrl: `${process.env.REACT_APP_API_URL_PRODUCTION}/render/status`,
      properties: {
        name: 'EC',
      },
    });

    const config = {
      method: 'post',
      url: `https://api.opentok.com/v2/project/${process.env.VIDEO_API_API_KEY}/render`,
      headers: {
        'X-OPENTOK-AUTH': await generateRestToken(),
        // 'X-OPENTOK-AUTH':
        //   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI0NzM5NjUwMSIsImlzdCI6InByb2plY3QiLCJleHAiOjE2NTg0ODM3NDIsImp0aSI6MTE5LjU3MzcwMDQzMTI2MzE1LCJpYXQiOjE2NTgzMTgzNDl9.m4yZUOFcUiQszLcglK1dgaVQucCyIxCJzjlA06cb_VI',
        'Content-Type': 'application/json',
      },
      data: data,
    };

    const response = await axios(config);
    return response.data;
  } catch (e) {
    console.log(e);
    return e;
  }
};

const forceDisconnect = async (sessionId, connectionId) => {
  const config = {
    method: 'delete',
    url: `https://api.opentok.com/v2/project/${apiKey}/session/${sessionId}/connection/${connectionId}`,
    headers: {
      'X-OPENTOK-AUTH': await generateRestToken(),
      'Content-Type': 'application/json',
    },
  };
  console.log(config);

  try {
    const response = await axios(config);
    return response.data;
  } catch (e) {
    console.log(`there was an error` + e);
    return e;
  }
};

const deleteRender = async (id) => {
  const config = {
    method: 'delete',
    url: `https://api.opentok.com/v2/project/${apiKey}/render/${id}`,
    headers: {
      'X-OPENTOK-AUTH': await generateRestToken(),
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (e) {
    console.log(e);
    return e;
  }
};

const generateToken = (sessionId, role) => {
  const token = role
    ? opentok.generateToken(sessionId, { data: role })
    : opentok.generateToken(sessionId);
  return { token: token, apiKey: apiKey };
};

const initiateArchiving = async (sessionId) => {
  const archive = await createArchive(sessionId);
  return archive;
};

const stopArchiving = async (archiveId) => {
  console.log(archiveId);
  const response = await stopArchive(archiveId);
  return response;
};

const getCredentials = async (session = null, role) => {
  console.log('gen creds for ' + role);
  const data = await createSessionandToken(session, role);
  sessionId = data.sessionId;
  const token = data.token;
  return { sessionId: sessionId, token: token, apiKey: apiKey };
};

const listArchives = async (sessionId) => {
  return new Promise((resolve, reject) => {
    const options = { sessionId };
    opentok.listArchives(options, (error, archives) => {
      if (error) {
        reject(error);
      } else {
        resolve(archives);
      }
    });
  });
};

const startStreamer = async (streamId, sessionId) => {
  try {
    const { token } = generateToken(sessionId, 'publisher');

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
    console.log(e?.response?.data);
    return e;
  }
};

module.exports = {
  getCredentials,
  generateToken,
  initiateArchiving,
  stopArchiving,
  listArchives,
  generateRestToken,
  createRender,
  deleteRender,
  signal,
  forceDisconnect,
  startStreamer,
  addStreamToArchive,
};

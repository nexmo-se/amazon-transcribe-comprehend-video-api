import axios from 'axios';

let API_URL = process.env.REACT_APP_API_URL_DEVELOPMENT;

console.log(process.env.NODE_ENV, API_URL);

// let API_URL = `http://localhost:5000`;
if (process.env.NODE_ENV === 'production') {
  API_URL = `${process.env.REACT_APP_API_URL_PRODUCTION}`;
}

export const getCredentials = async (roomName) => {
  return axios.get(`${API_URL}/session/${roomName}`);
};
export const getVirtualViewerCredentials = async (roomName) => {
  return axios.get(`${API_URL}/session/${roomName}?role=virtual`);
};

export const startTranslation = async (
  streamId,
  sessionId,
  streamName,
  specialty
) => {
  return axios.post(`${API_URL}/startStreaming`, {
    streamId,
    sessionId,
    streamName,
    specialty,
  });
};

export const stopStreamer = async (sessionId, connectionId) => {
  return axios.get(`${API_URL}/stopStreamer/${sessionId}/${connectionId}`);
};

export const getToken = async () => {
  return axios.get(`${API_URL}/token`);
};

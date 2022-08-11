import axios from 'axios';
let API_URL = `${process.env.REACT_APP_API_URL_DEVELOPMENT}`;
if (process.env.NODE_ENV === 'production') {
  API_URL = `${process.env.REACT_APP_API_URL_PRODUCTION}`;
}
const fetchRecordings = (sessionId) => {
  return axios.get(`${API_URL}/archive/${sessionId}`);
};

const startRecording = (sessionId) => {
  console.log('Got session client side' + sessionId);
  return axios.post(`${API_URL}/archive/start`, {
    session_id: sessionId,
  });
};

const render = (roomName) => {
  return axios.post(`${API_URL}/render`, { roomName: roomName });
};

const stopRender = (id) => {
  return axios.get(`${API_URL}/render/stop/${id}`);
};

const stopRecording = (archiveId) => {
  return axios.get(`${API_URL}/archive/stop/${archiveId}`);
};

export { fetchRecordings, startRecording, stopRecording, render, stopRender };

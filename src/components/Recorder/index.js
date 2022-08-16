import Main from '../Main';
import Header from '../Header';
import styles from './styles.js';
import React from 'react';

import { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { useParams } from 'react-router';

import { usePublisher } from '../../hooks/usePublisher';
import { useSession } from '../../hooks/useSession';

import ToolBar from '../ToolBar';
import { getVirtualViewerCredentials } from '../../api/fetchCreds';
import { UserContext } from '../../context/UserContext';
import { useSignalling } from '../../hooks/useSignalling';

function VirtualView() {
  let translationPlaying = useRef(false);
  const [userId, setUserId] = useState(null);
  const [credentials, setCredentials] = useState(null);
  let timePlayingLeft = useRef(0);
  // const [timePlayingLeft, setTime] = useState(0);
  const videoContainer = useRef();
  let { roomName } = useParams();
  const { preferences } = useContext(UserContext);

  const ws = useRef(null);
  const ctx = useRef(null);
  const gainNodeRef = useRef(null);
  const context = useRef(null);

  const [captions, setCaptions] = useState('Say something...');
  const [originalCaptions, setOriginalCaptions] = useState('');
  const { session, createSession, connected, streams } = useSession({
    container: videoContainer,
  });
  const { messages, sendMessage } = useSignalling({
    session: session.current,
  });

  useEffect(() => {
    setCaptions(messages);
  }, [messages]);

  const isVirtualView = () => {
    if (session) return session.connection.data === 'virtual';
    else return;
  };

  useEffect(() => {
    getVirtualViewerCredentials(roomName)
      .then(({ data }) => {
        setCredentials({
          apiKey: data.apiKey,
          sessionId: data.sessionId,
          token: data.token,
        });
        setUserId(data.userId);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [roomName]);

  useEffect(() => {
    if (credentials) {
      const { apiKey, sessionId, token } = credentials;
      console.log(apiKey);
      createSession({ apiKey, sessionId, token });
    }
  }, [createSession, credentials]);

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // const startListeners = useCallback(() => {
  //   if (ws.current) {
  //     context.current = new AudioContext();
  //     ws.current.onmessage = (event) => {
  //       if (typeof event.data === 'string') {
  //         let info = JSON.parse(event.data);
  //         const streamId = info.id;
  //         if (translationPlaying.current) {
  //           wait(timePlayingLeft.current * 1000).then(() => {
  //             console.log('waiting');
  //             // if (doesWantOriginalCaptions(streamId)) {
  //             setOriginalCaptions(`Original : ${info.original}`);
  //             // }
  //             setCaptions(`Translated: ${info.translated}`);
  //             // sendMessage(info.translated);
  //           });
  //         } else {
  //           // if (doesWantOriginalCaptions(streamId)) {
  //           setOriginalCaptions(`Original : ${info.original}`);
  //           // }
  //           setCaptions(`Translated: ${info.translated}`);
  //         }
  //       } else {
  //         const timestamp = new Intl.DateTimeFormat('en-US', {
  //           year: 'numeric',
  //           month: '2-digit',
  //           day: '2-digit',
  //           hour: '2-digit',
  //           minute: '2-digit',
  //           second: '2-digit',
  //         }).format(Date.now());
  //         console.log('Received audio at ' + timestamp);
  //         // sendMessage(event.data);

  //         context.current
  //           .decodeAudioData(event.data)
  //           .then(function (decodedData) {
  //             handleAudioData(decodedData);
  //           });
  //       }
  //     };
  //     // Fired when the WebSocket closes unexpectedly due to an error or lost connetion
  //     ws.current.onerror = (err) => {
  //       console.error(err);
  //     };
  //     // Fired when the WebSocket connection has been closed
  //     ws.current.onclose = (event) => {
  //       console.info('Connection to websocket closed');
  //       console.log(event);
  //     };
  //     ws.current.onopen = (event) => {
  //       console.log('Connected');

  //       // ws.current.send(
  //       //   `{"from":"${preferences.defaultSettings.originLanguage}", "to":"${preferences.defaultSettings.destinationLanguage}", "room":"${roomName}","user":"${preferences.streamId}", "digitalHuman":"${preferences.digitalHuman}"}`
  //       // );
  //     };
  //   }
  // }, []);

  // useEffect(() => {
  //   let AudioContext = window.AudioContext;
  //   ctx.current = new AudioContext();
  //   let wsUrl = `ws:localhost:5000/virtualviewers/${roomName}`;

  //   if (process.env.NODE_ENV === 'production') {
  //     wsUrl = `${process.env.REACT_APP_WS_URL_PRODUCTION}/virtualviewers/${roomName}`;
  //   } else if (process.env.REACT_APP_SERVER_PORT) {
  //     wsUrl = `ws:localhost:${process.env.REACT_APP_SERVER_PORT}/virtualviewers/${roomName}`;
  //   }
  //   wsUrl = wsUrl + encodeURI('?userid=virtualviewer' + '&room=' + roomName);
  //   console.log('main WS: ' + wsUrl);

  //   ws.current = new WebSocket(wsUrl);
  //   ws.current.binaryType = 'arraybuffer';
  //   startListeners();
  // }, [startListeners, roomName, preferences.streamId]);

  const classes = styles();
  return (
    <div className={classes.flex}>
      <Header />
      <div className="videoContainer">
        <div
          className={'video'}
          ref={videoContainer}
          id="video-container"
        ></div>
      </div>
      <div className="original"> {originalCaptions}</div>
      <div className="original"> {captions}</div>
    </div>
  );
}

export default VirtualView;

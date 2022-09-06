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
import EntitiesList from '../EntitiesList';

function VirtualView() {
  let translationPlaying = useRef(false);
  const [userId, setUserId] = useState(null);
  const [credentials, setCredentials] = useState(null);
  let timePlayingLeft = useRef(0);
  // const [timePlayingLeft, setTime] = useState(0);
  const videoContainer = useRef();
  let { roomName } = useParams();
  const { preferences } = useContext(UserContext);

  const [captions, setCaptions] = useState({
    text: 'Say something...',
    speaker: '',
  });
  const { session, createSession, connected, streams } = useSession({
    container: videoContainer,
  });

  const {
    messages,
    sendMessage,
    medication,
    medicalConditions,
    piiEntities,
    anatomyEntities,
    ttpEntities,
  } = useSignalling({
    session: session.current,
  });

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

  useEffect(() => {
    setCaptions(messages);
  }, [messages]);

  const classes = styles();
  return (
    <>
      <div className="videoContainer">
        <div
          className={'video'}
          ref={videoContainer}
          id="video-container"
        ></div>
        <div
          className="medicalAnalysis"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 820,
            overflow: 'hidden',
            overflowY: 'scroll',
          }}
        >
          <div className="entityType">
            <EntitiesList
              listOfEntities={medicalConditions}
              entity={'Medical Condition'}
            />
          </div>
          <div className="entityType">
            <EntitiesList listOfEntities={medication} entity={'Medication'} />
          </div>
          <div className="entityType">
            <EntitiesList listOfEntities={anatomyEntities} entity={'Anatomy'} />
          </div>
          <div className="entityType">
            <EntitiesList listOfEntities={piiEntities} entity={'PII'} />
          </div>
          <div className="entityType">
            <EntitiesList
              listOfEntities={ttpEntities}
              entity={'Test Treatment Procedures'}
            />
          </div>
        </div>
      </div>
      <div className="original">
        {captions ? `${captions.speaker}: ${captions.text}` : ''}
      </div>
    </>
  );
}

export default VirtualView;

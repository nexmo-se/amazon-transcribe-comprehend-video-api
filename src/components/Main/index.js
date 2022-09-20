import { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { useParams } from 'react-router';

import { usePublisher } from '../../hooks/usePublisher';
import { useSession } from '../../hooks/useSession';
import { stopRender, stopRecording } from '../../api/fetchRecording';
import ToolBar from '../ToolBar';
import { getCredentials } from '../../api/fetchCreds';
import { UserContext } from '../../context/UserContext';
import { useSignalling } from '../../hooks/useSignalling';
import { usePDFMine } from '../../hooks/usePDFMine';
import { PDFDownloadLink, Document, Page } from '@react-pdf/renderer';

import EntitiesList from '../EntitiesList';
import { MessageSharp } from '@material-ui/icons';

function Main() {
  // const [timePlayingLeft, setTime] = useState(0);
  const videoContainer = useRef();
  let { roomName } = useParams();
  const { preferences, setPreferences } = useContext(UserContext);
  const [captions, setCaptions] = useState({
    text: 'Say something...',
    speaker: '',
  });

  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState(null);
  const [hasAudio, setHasAudio] = useState(true);
  const [hasVideo, setHasVideo] = useState(true);
  const [userId, setUserId] = useState(null);
  // const [translationPlaying, setTranslationPlaying] = useState(false);

  const {
    session,
    createSession,
    connected,
    status,
    destroySession,
    isArchiving,
  } = useSession({
    container: videoContainer,
  });

  const { MyDocument, instance } = usePDFMine();
  // const medicalConditions = ['heart failure', 'type 2 diabetes', 'lung cancer'];
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

  const {
    publisher,
    publish,
    pubInitialised,
    isPublishing,
    publisherError,
    destroyPublisher,
    unpublish,
  } = usePublisher();

  useEffect(() => {
    setCaptions(messages);
  }, [messages]);

  useEffect(() => {
    console.log(messages);
    console.log(preferences);

    if (
      messages &&
      preferences.messages?.[preferences.messages.length - 1]?.text !=
        messages.text
      // preferences.messages.length
    ) {
      const messagesWithDate = {
        ...messages,
        timestamp: new Date().toTimeString(),
      };
      setPreferences({
        ...preferences,
        messages: [...preferences.messages, messagesWithDate],
      });
    }
  }, [messages, preferences, setPreferences]);

  useEffect(() => {
    getCredentials(roomName)
      .then(({ data }) => {
        console.log('Credential data: ', data);
        setCredentials({
          apiKey: data.apiKey,
          sessionId: data.sessionId,
          token: data.token,
        });
        setUserId(data.userId);
      })
      .catch((err) => {
        setError(err);
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

  const handleAudioChange = useCallback(() => {
    if (hasAudio) {
      publisher.publishAudio(false);
      setHasAudio(false);
    } else {
      publisher.publishAudio(true);
      setHasAudio(true);
    }
  }, [hasAudio, publisher]);

  const handleVideoChange = useCallback(() => {
    if (hasVideo) {
      publisher.publishVideo(false);
      setHasVideo(false);
      try {
      } catch (e) {
        console.log(e);
      }
    } else {
      publisher.publishVideo(true);
      setHasVideo(true);
      try {
      } catch (e) {
        console.log(e);
      }
    }
  }, [hasVideo, publisher]);

  useEffect(() => {
    if (
      session.current &&
      connected &&
      !pubInitialised &&
      videoContainer.current
    ) {
      // todo It might be better to change state of this component.
      publish({
        session: session.current,
        containerId: videoContainer.current.id,
      });
    }
  }, [publish, session, connected, pubInitialised]);

  useEffect(() => {
    return () => {
      destroyPublisher();
    };
  }, [destroyPublisher]);

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

      <ToolBar
        handleAudioChange={handleAudioChange}
        handleVideoChange={handleVideoChange}
        session={session.current}
        hasAudio={hasAudio}
        hasVideo={hasVideo}
        publisher={publisher}
        isArchiving={isArchiving}
      />
    </>
  );
}

export default Main;

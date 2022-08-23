import { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { useParams } from 'react-router';

import { usePublisher } from '../../hooks/usePublisher';
import { useSession } from '../../hooks/useSession';
import { stopRender, stopRecording } from '../../api/fetchRecording';
import ToolBar from '../ToolBar';
import { getCredentials } from '../../api/fetchCreds';
import { UserContext } from '../../context/UserContext';
import { useSignalling } from '../../hooks/useSignalling';

import EntitiesList from '../EntitiesList';

function Main() {
  let translationPlaying = useRef(false);
  let timePlayingLeft = useRef(0);
  // const [timePlayingLeft, setTime] = useState(0);
  const videoContainer = useRef();
  let { roomName } = useParams();
  const { preferences } = useContext(UserContext);
  const [captions, setCaptions] = useState('Say something...');

  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState(null);
  const [hasAudio, setHasAudio] = useState(true);
  const [hasVideo, setHasVideo] = useState(true);
  const [userId, setUserId] = useState(null);
  // const [translationPlaying, setTranslationPlaying] = useState(false);

  const { session, createSession, connected, status } = useSession({
    container: videoContainer,
  });
  // const medicalConditions = ['heart failure', 'type 2 diabetes', 'lung cancer'];
  const {
    messages,
    sendMessage,
    medication,
    medicalConditions,
    piiEntities,
    anatomyEntities,
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
  } = usePublisher();

  useEffect(() => {
    setCaptions(messages);
  }, [messages]);

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

  // useEffect(() => {
  //   if (preferences.renderId && preferences.archiveId && preferences.recording)
  //     return () => {
  //       destroyPublisher();
  //     };
  // }, [
  //   destroyPublisher,
  //   preferences.archiveId,
  //   preferences.recording,
  //   preferences.renderId,
  // ]);

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

  return (
    <>
      <div className="videoContainer">
        <div
          className={'video'}
          ref={videoContainer}
          id="video-container"
        ></div>
        <div className="medicalAnalysis">
          <div className="entityType">
            <EntitiesList
              listOfEntities={medicalConditions}
              entity={'Medical Condition'}
            />
          </div>
          <div className="entityType">
            {medication ? (
              <EntitiesList listOfEntities={medication} entity={'Medication'} />
            ) : null}
          </div>
          {/* <div className="entityType">
            <EntitiesList
              listOfEntities={anatomyEntities}
              entity={'Anatomy'}
            />
          </div> */}
          <div className="entityType">
            <EntitiesList listOfEntities={anatomyEntities} entity={'Anatomy'} />
          </div>
          <div className="entityType">
            <EntitiesList listOfEntities={piiEntities} entity={'PII'} />
          </div>
        </div>
      </div>
      <div className="original"> {captions}</div>
      <ToolBar
        handleAudioChange={handleAudioChange}
        handleVideoChange={handleVideoChange}
        session={session.current}
        hasAudio={hasAudio}
        hasVideo={hasVideo}
      />
    </>
  );
}

export default Main;

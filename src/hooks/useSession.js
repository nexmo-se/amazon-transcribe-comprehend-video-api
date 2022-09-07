import React, { useState, useRef, useCallback } from 'react';

import _ from 'lodash';
import OT from '@opentok/client';
// const OT = window.OT;

export function useSession({ container }) {
  const [connected, setConnected] = useState(false);
  const [streams, setStreams] = useState([]);
  const sessionRef = useRef(null);
  const [status, setNetworkStatus] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const addStream = ({ stream }) => {
    setStreams((prev) => [...prev, stream]);
  };

  const removeStream = ({ stream }) => {
    setStreams((prev) =>
      prev.filter((prevStream) => prevStream.id !== stream.id)
    );
  };

  const isExperienceComposer = () => {
    const queryString = window.location.pathname;
    return queryString.split('/')[2] === 'virtualviewer';
  };

  const isRecorder = () => {
    const queryString = window.location.pathname;
    return queryString.split('/')[2] === 'recorder';
  };

  const shouldSubscribe = (name) => {
    // if (name.split('_')[1] === 'EC') return false;
    return name !== 'EC';
    // if (name === 'EC') return false;
    // else return true;
  };

  const subscribe = React.useCallback(
    (stream, options = {}) => {
      console.log(stream);
      if (sessionRef.current && container.current) {
        const finalOptions = Object.assign({}, options, {
          insertMode: 'append',
          width: '100%',
          height: '100%',
          fitMode: 'contain',
          style: {
            buttonDisplayMode: 'on',
            nameDisplayMode: 'on',
          },
          showControls: true,
          subscribeToVideo: shouldSubscribe(stream.name),
          // subscribeToAudio: shouldSubscribeToVideo(stream.name),
          // subscribeToAudio: !isExperienceComposer(),
          subscribeToAudio: shouldSubscribe(stream.name),
          //   isExperienceComposer() && stream.name === 'EC' ? false : true,
        });
        const subscriber = sessionRef.current.subscribe(
          stream,
          shouldSubscribe(stream.name) ? container.current.id : null,
          finalOptions
        );
      }
    },
    [container]
  );

  const onStreamCreated = useCallback(
    (event) => {
      console.log('stream created event ' + event.stream.name);
      console.log(' subscribe to video ' + shouldSubscribe(event.stream.name));
      console.log('is experience composer ' + isExperienceComposer());

      subscribe(event.stream);
      addStream({ stream: event.stream });
    },
    [subscribe]
  );

  const onStreamDestroyed = useCallback((event) => {
    removeStream({ stream: event.stream });
  }, []);

  const onArchiveStarted = useCallback((event) => {
    setIsArchiving(true);
  }, []);

  const onArchiveStopped = useCallback((event) => {
    setIsArchiving(false);
  }, []);

  const onSessionDisconnected = useCallback((event) => {
    setNetworkStatus('disconnected');
  }, []);
  const onSessionReconnecting = useCallback((event) => {
    setNetworkStatus('reconnecting');
  }, []);

  const onConnectionDestroyed = useCallback(
    (event) => {
      console.log(event);
      if (container.current) container.current = null;
    },
    [container]
  );

  const createSession = useCallback(
    ({ apiKey, sessionId, token }) => {
      if (!apiKey) {
        throw new Error('Missing apiKey');
      }

      if (!sessionId) {
        throw new Error('Missing sessionId');
      }

      if (!token) {
        throw new Error('Missing token');
      }

      sessionRef.current = OT.initSession(apiKey, sessionId, {});
      const eventHandlers = {
        streamCreated: onStreamCreated,
        streamDestroyed: onStreamDestroyed,
        sessionReconnecting: onSessionReconnecting,
        sessionDisconnected: onSessionDisconnected,
        connectionDestoyed: onConnectionDestroyed,
        archiveStarted: onArchiveStarted,
        archiveStopped: onArchiveStopped,
      };
      sessionRef.current.on(eventHandlers);
      return new Promise((resolve, reject) => {
        sessionRef.current.connect(token, (err) => {
          if (!sessionRef.current) {
            // Either this session has been disconnected or OTSession
            // has been unmounted so don't invoke any callbacks
            return;
          }
          if (err) {
            reject(err);
          } else if (!err) {
            console.log('Session Connected!');
            setConnected(true);
            resolve(sessionRef.current);
          }
        });
      });
    },
    [
      onArchiveStarted,
      onArchiveStopped,
      onConnectionDestroyed,
      onSessionDisconnected,
      onSessionReconnecting,
      onStreamCreated,
      onStreamDestroyed,
    ]
  );

  const destroySession = React.useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.on('disconnected', () => {
        sessionRef.current = null;
      });
      sessionRef.current.disconnect();
    }
  }, []);

  return {
    session: sessionRef,
    connected,
    createSession,
    destroySession,
    streams,
    status,
    isArchiving,
  };
}

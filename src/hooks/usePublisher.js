import React, { useCallback, useRef, useState, useContext } from 'react';
import OT from '@opentok/client';

import { useParams } from 'react-router';
import { UserContext } from '../context/UserContext';
import { stopRecording, stopRender } from '../api/fetchRecording';
import useDevices from '../hooks/useDevices';

import { startTranslation, stopStreamer } from '../api/fetchCreds';

export function usePublisher() {
  let { roomName } = useParams();
  const { preferences } = useContext(UserContext);
  const [isPublishing, setIsPublishing] = useState(false);
  const [pubInitialised, setPubInitialised] = useState(false);
  const publisherRef = useRef();
  const [publisherError, setPublisherError] = useState(null);
  const [connectionIdFromStream, setConnectionIdFromStreamer] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const { deviceInfo, getDevices } = useDevices();

  const streamCreatedListener = React.useCallback(
    ({ stream }) => {
      if (stream.name !== 'EC') {
        console.log(stream);
        // preferences.streamId = stream.id;
        const sessionId = stream.publisher.session.id;
        console.log(sessionId);
        setSessionId(sessionId);

        // setConnectionIdFromStreamer('124');
        console.log({ roomName, specialty: localStorage.getItem('specialty') });
        startTranslation(
          stream.id,
          sessionId,
          stream.name,
          localStorage.getItem('specialty')
        )
          .then((data) => {
            console.log(data.data);
            console.log('setting connectionId ' + data.data.connectionId);
            setConnectionIdFromStreamer(data.data.connectionId);
          })
          .catch((e) => console.log(e));
        setIsPublishing(true);
      }
    },
    [roomName]
  );

  const streamDestroyedListener = useCallback(({ stream }) => {
    console.log('destroyed publisher');

    //the problem seems to be sessionid is undefined

    // .then((data) => {})
    // .catch((e) => console.log(e));
    publisherRef.current = null;

    setPubInitialised(false);
    setIsPublishing(false);
  }, []);

  const initPublisher = useCallback(
    (containerId, publisherOptions) => {
      console.log('UsePublisher - initPublisher');
      if (publisherRef.current) {
        console.log('UsePublisher - Already initiated');
        return;
      }
      if (!containerId) {
        console.log('UsePublisher - Container not available');
      }
      const finalPublisherOptions = Object.assign({}, publisherOptions, {
        width: '100%',
        height: '100%',
        //name: preferences.name,
        name: localStorage.getItem('username'),
        publishVideo: true,
        publishAudio: true,
        style: {
          buttonDisplayMode: 'on',
          nameDisplayMode: 'off',
        },
        insertMode: 'append',
        showControls: true,
        fitMode: 'contain',
      });
      console.log('usePublisher finalPublisherOptions', finalPublisherOptions);
      publisherRef.current = OT.initPublisher(
        containerId,
        finalPublisherOptions,
        (err) => {
          if (err) {
            console.log('[usePublisher]', err);
            publisherRef.current = null;
          }
          console.log('Publisher Created');
        }
      );

      publisherRef.current.on('accessAllowed', getDevices);

      setPubInitialised(true);

      publisherRef.current.on('streamCreated', streamCreatedListener);
      publisherRef.current.on('streamDestroyed', streamDestroyedListener);
      publisherRef.current.on('destroyed', () => {
        publisherRef.current = null;
        console.log(publisherRef);
        console.log('publisherRef.current Destroyed');
      });

      return () => {
        publisherRef.current.off('streamCreated', streamCreatedListener);
        publisherRef.current.off('streamDestroyed', streamDestroyedListener);
        publisherRef.current.off('destroyed', () => {});
      };
    },
    [getDevices, streamCreatedListener, streamDestroyedListener]
  );

  const destroyPublisher = useCallback(() => {
    if (!publisherRef.current) {
      return;
    }
    if (publisherRef.current) {
      publisherRef.current.destroy();
    }
  }, []);

  const publish = useCallback(
    ({ session, containerId, publisherOptions }) => {
      if (!publisherRef.current) {
        initPublisher(containerId, publisherOptions);
      }
      if (session && publisherRef.current && !isPublishing) {
        return new Promise((resolve, reject) => {
          session.publish(publisherRef.current, (err) => {
            if (err) {
              console.log('Publisher Error', err);
              setIsPublishing(false);
              publisherRef.current = null;
              setPublisherError(true);
              reject(err);
            }
            console.log('Published');
            resolve(publisherRef.current);
          });
        });
      } else if (publisherRef.current) {
        // nothing to do
      }
    },
    [initPublisher, isPublishing]
  );

  const unpublish = useCallback(
    ({ session }) => {
      if (publisherRef.current && isPublishing && session) {
        session.unpublish(publisherRef.current);
        setIsPublishing(false);
        publisherRef.current = null;
      }
    },
    [isPublishing]
  );

  return {
    publisher: publisherRef.current,
    initPublisher,
    destroyPublisher,
    publish,
    pubInitialised,
    unpublish,
    isPublishing,
    publisherError,
    deviceInfo,
  };
}

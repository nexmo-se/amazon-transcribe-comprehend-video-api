import { useState, useCallback, useEffect, useContext } from 'react';
// import { Message } from '../entities/ChatMessage';
// import { UserContext } from '../context/UserContext';
import { v4 as uuid } from 'uuid';

export function useSignalling({ session }) {
  const [messages, setMessages] = useState([]);
  const [archiveId, setArchiveId] = useState(null);
  const [renderedSesion, setRenderedSession] = useState(null);
  //   const { user } = useContext(UserContext);

  const signal = useCallback(
    async ({ type, data }) => {
      return new Promise((resolve, reject) => {
        const payload = JSON.parse(JSON.stringify({ type, data }));
        if (session) {
          session.signal(payload, (err) => {
            if (err) reject(err);
            else resolve();
          });
        }
      });
    },
    [session]
  );

  const archiveListener = useCallback(({ data }) => {
    console.log(data);
    const archiveId = data.split(':')[0];
    const sessionRendered = data.split(':')[1];
    setArchiveId(archiveId);
    setRenderedSession(sessionRendered);
  }, []);

  const sendMessage = useCallback(
    (message) => {
      return signal({ type: 'message', data: message });
    },
    [signal]
  );

  const messageListener = useCallback(({ data, from }) => {
    console.log('received message');
    console.log(data);
    setMessages({ data, from });
    // console.log('this is the data' + data);
    // let AudioContext = window.AudioContext;
    // var ctx = new AudioContext();
    // ctx.decodeAudioData(data).then(function (decodedData) {
    //   const source = ctx.createBufferSource();
    //   source.buffer = decodedData;
    //   source.connect(ctx.destination);
    //   source.start();
    // });
  }, []);

  useEffect(() => {
    if (session) {
      session.on('signal:captions', messageListener);
      session.on('signal:archiveStarted', archiveListener);
    }
    return function cleanup() {
      if (session) {
        session.off('signal:captions', messageListener);
        session.off('signal:archiveStarted', archiveListener);
      }
    };
  }, [session, messageListener, archiveListener]);

  return { sendMessage, messages, archiveId, renderedSesion };
}

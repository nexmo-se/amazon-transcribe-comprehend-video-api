import React from 'react';

import MuteAudioButton from '../MuteAudioButton';
import MuteVideoButton from '../MuteVideoButton';
import RecordButton from '../RecordButton';
import EndCallButton from '../EndCallButton';
import { useSignalling } from '../../hooks/useSignalling';
import { useHistory } from 'react-router-dom';
import { useParams } from 'react-router';
import { usePublisher } from '../../hooks/usePublisher';

import styles from './styles';

function ToolBar({
  session,
  handleVideoChange,
  handleAudioChange,
  hasVideo,
  hasAudio,
}) {
  const classes = styles();
  const { push } = useHistory();
  const { roomName } = useParams();
  const { renderedSesion } = useSignalling({ session });
  const { destroyPublisher } = usePublisher();

  const endCall = () => {
    if (session) {
      push(`/videorti/${roomName}/${renderedSesion}/end`);
      // destroyPublisher();
    }
  };
  return (
    <div className="toolbar">
      <MuteAudioButton
        classes={classes}
        handleAudioChange={handleAudioChange}
        hasAudio={hasAudio}
      />
      <MuteVideoButton
        classes={classes}
        handleVideoChange={handleVideoChange}
        hasVideo={hasVideo}
      />
      <RecordButton classes={classes} session={session} />
      <EndCallButton classes={classes} handleEndCall={endCall} />
    </div>
  );
}

export default ToolBar;

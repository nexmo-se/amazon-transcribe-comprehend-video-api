import React from 'react';

import MuteAudioButton from '../MuteAudioButton';
import MuteVideoButton from '../MuteVideoButton';
import RecordButton from '../RecordButton';
import EndCallButton from '../EndCallButton';
import { useSignalling } from '../../hooks/useSignalling';
import { useHistory } from 'react-router-dom';
import { useParams } from 'react-router';
import { usePublisher } from '../../hooks/usePublisher';
import { useSession } from '../../hooks/useSession';
import { UserContext } from '../../context/UserContext';

import styles from './styles';

function ToolBar({
  session,
  handleVideoChange,
  handleAudioChange,
  hasVideo,
  hasAudio,
  publisher,
  isArchiving,
}) {
  const classes = styles();
  const { push } = useHistory();
  const { roomName } = useParams();
  const { renderedSesion } = useSignalling({ session });
  const { preferences } = React.useContext(UserContext);

  const endCall = () => {
    if (publisher) {
      // session.disconnect();
      // publisher.destroy();
      push(`/mta/${roomName}/${preferences.sessionId}/end`);
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
      <RecordButton
        classes={classes}
        session={session}
        isArchiving={isArchiving}
      />
      <EndCallButton classes={classes} handleEndCall={endCall} />
    </div>
  );
}

export default ToolBar;

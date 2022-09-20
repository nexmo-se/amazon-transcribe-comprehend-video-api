import { useState, useContext } from 'react';
import {
  startRecording,
  stopRecording,
  render,
  stopRender,
  addArchiveStream,
} from '../../api/fetchRecording';

import { useSignalling } from '../../hooks/useSignalling';

import { UserContext } from '../../context/UserContext';

import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { IconButton } from '@material-ui/core';
import styles from './styles';
import Tooltip from '@mui/material/Tooltip';
import { useParams } from 'react-router';
import { useEffect } from 'react';

export default function RecordingButton({ classes, session, isArchiving }) {
  const { preferences, setPreferences } = useContext(UserContext);
  let { roomName } = useParams();
  const { archiveId } = useSignalling({ session });
  // const [isArchiving, setRecording] = useState(false);
  const [renderId, setRenderId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const localClasses = styles();

  const startRender = async (roomName) => {
    if (isArchiving) return;
    try {
      const renderData = await render(roomName);
      if ((renderData.status = 200 && renderData.data)) {
        const { id, sessionId } = renderData.data;
        // console.log(renderData.data);
        // setRenderId('12334');
        preferences.renderId = id;
        preferences.sessionId = sessionId;
        setRenderId(id);
        // setRecording(true);
        setSessionId(sessionId);
      } else return;
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    console.log('run preferences hook');
    if (
      renderId !== preferences.renderId ||
      archiveId !== preferences.archiveId ||
      sessionId !== preferences.sessionId
    ) {
      if (renderId) {
        setPreferences({
          ...preferences,
          renderId: renderId,
          archiveId: archiveId,
          sessionId: sessionId,
        });
      }
    }
  }, [renderId, setPreferences, archiveId, preferences, sessionId]);

  useEffect(() => {
    if (preferences.recording !== isArchiving) {
      setPreferences({
        ...preferences,
        recording: isArchiving,
      });
    }
    // } else {
    //   setPreferences({
    //     ...preferences,
    //     recording: false,
    //   });
    // }
  }, [isArchiving, preferences, setPreferences]);

  const stopRenderAndRecording = async (renderId) => {
    if (renderId) {
      try {
        const renderData = await stopRender(renderId);
        console.log(renderData);
        if ((renderData.status = 200)) {
          handleRecordingStop(archiveId);
          setRenderId(null);
        } else return;
      } catch (e) {
        console.log(e);
      }
    } else return;
  };

  const handleRecordingStop = async (archiveId) => {
    try {
      if (isArchiving && archiveId) {
        const data = await stopRecording(archiveId);
        console.log(data);
        if (data.status === 200 && data.data) {
          const { status } = data.data;
          // setRecording(false);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleRecordingAction = () => {
    console.log('trying to start recording');
    isArchiving ? stopRenderAndRecording(renderId) : startRender(roomName);
    // ? handleRecordingStop(archiveId)
    // : handleRecordingStart(sessionId);
  };

  const title = isArchiving ? 'Stop Recording' : 'Start Recording';

  return (
    <Tooltip title={title} aria-label="add">
      <IconButton
        // edge="start"
        // color="inherit"
        // edge="start"
        aria-label="record"
        onClick={handleRecordingAction}
        // size="small"
        className={classes.toolbarButtons}
      >
        {isArchiving ? (
          <FiberManualRecordIcon
            fontSize="large"
            className={localClasses.activeRecordingIcon}
            style={{ color: '#D50F2C' }}
          />
        ) : (
          <FiberManualRecordIcon fontSize="large" />
        )}
      </IconButton>
    </Tooltip>
  );
}

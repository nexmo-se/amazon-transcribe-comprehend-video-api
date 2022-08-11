import { useState, useContext } from 'react';
import {
  startRecording,
  stopRecording,
  render,
  stopRender,
} from '../../api/fetchRecording';

import { fixChrome687574, stopRenderAndRecording } from '../../utils';

import { useSignalling } from '../../hooks/useSignalling';

import { UserContext } from '../../context/UserContext';

import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { IconButton } from '@material-ui/core';
import styles from './styles';
import Tooltip from '@mui/material/Tooltip';
import { useParams } from 'react-router';
import { useEffect } from 'react';

export default function RecordingButton({ classes, session }) {
  const { preferences, setPreferences } = useContext(UserContext);
  let { roomName } = useParams();
  const { archiveId } = useSignalling({ session });
  const [isRecording, setRecording] = useState(false);
  const [renderId, setRenderId] = useState(null);
  const localClasses = styles();

  const startRender = async (roomName) => {
    if (isRecording) return;
    try {
      const renderData = await render(roomName);
      if ((renderData.status = 200 && renderData.data)) {
        const { id, sessionId } = renderData.data;
        // console.log(renderData.data);
        // setRenderId('12334');
        preferences.renderId = id;
        setRenderId(id);
        setRecording(true);
      } else return;
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    console.log('run preferences hook');
    if (
      renderId !== preferences.renderId ||
      archiveId !== preferences.archiveId
    ) {
      if (renderId) {
        setPreferences({
          ...preferences,
          renderId: renderId,
          archiveId: archiveId,
        });
      }
    }
  }, [renderId, setPreferences, archiveId, preferences]);

  useEffect(() => {
    if (preferences.recording !== isRecording) {
      setPreferences({
        ...preferences,
        recording: isRecording,
      });
    }
    // } else {
    //   setPreferences({
    //     ...preferences,
    //     recording: false,
    //   });
    // }
  }, [isRecording, preferences, setPreferences]);

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
      if (isRecording) {
        const data = await stopRecording(archiveId);
        console.log(data);
        if (data.status === 200 && data.data) {
          const { status } = data.data;
          setRecording(false);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleRecordingAction = () => {
    console.log('trying to start recording');
    isRecording ? stopRenderAndRecording(renderId) : startRender(roomName);
    // ? handleRecordingStop(archiveId)
    // : handleRecordingStart(sessionId);
  };

  const title = isRecording ? 'Stop Recording' : 'Start Recording';

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
        {isRecording ? (
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

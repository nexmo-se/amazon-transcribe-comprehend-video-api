import React, { useContext, useEffect, useRef, useState } from 'react';
import OT from '@opentok/client';
import { useHistory } from 'react-router-dom';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField
} from '@material-ui/core';
import { usePublisher } from '../../hooks/usePublisher';
import { AudioSettings } from '../AudioSetting';
import { VideoSettings } from '../VideoSetting';
import { UserContext } from '../../context/UserContext';
import useStyles from './styles';
import { getAudioSourceDeviceId } from '../../utils';

export default function WaitingRoom() {
  const classes = useStyles();
  const { preferences, setPreferences } = useContext(UserContext);
  const { push } = useHistory();
  const defaultLocalAudio = true;
  const defaultLocalVideo = true;
  const [localAudio, setLocalAudio] = useState(defaultLocalAudio);
  const [localVideo, setLocalVideo] = useState(defaultLocalVideo);
  const [localVideoSource, setLocalVideoSource] = useState(undefined);
  const [localAudioSource, setLocalAudioSource] = useState(undefined);
  const [localAudioOutput, setLocalAudioOutput] = useState(undefined);
  let [audioDevice, setAudioDevice] = useState('');
  let [videoDevice, setVideoDevice] = useState('');
  let [audioOutputDevice, setAudioOutputDevice] = useState('');
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [isRoomNameInvalid, setIsRoomNameInvalid] = useState(false);
  const [isUserNameInvalid, setIsUserNameInvalid] = useState(false);
  const waitingRoomVideoContainer = useRef();

  const {
    publisher,
    initPublisher,
    destroyPublisher,
    deviceInfo,
    pubInitialised
  } = usePublisher();

  const handleAudioChange = React.useCallback((e) => {
    setLocalAudio(e.target.checked);
  }, []);

  const handleVideoChange = React.useCallback((e) => {
    setLocalVideo(e.target.checked);
  }, []);

  const handleVideoSource = React.useCallback(
    (e) => {
      const videoDeviceId = e.target.value;
      setVideoDevice(e.target.value);
      publisher.setVideoSource(videoDeviceId);
      setLocalVideoSource(videoDeviceId);
    },
    [publisher, setVideoDevice, setLocalVideoSource]
  );

  const handleAudioSource = React.useCallback(
    (e) => {
      const audioDeviceId = e.target.value;
      setAudioDevice(audioDeviceId);
      publisher.setAudioSource(audioDeviceId);
      setLocalAudioSource(audioDeviceId);
    },
    [publisher, setAudioDevice, setLocalAudioSource]
  );

  const handleAudioOutput = React.useCallback(
    (e) => {
      const audioOutputId = e.target.value;
      setAudioOutputDevice(audioOutputId);
      OT.setAudioOutputDevice(audioOutputId);
      setLocalAudioOutput(audioOutputId);
    },
    [setLocalAudioOutput, setAudioOutputDevice]
  );

  const validateForm = () => {
    console.log("validateForm", userName);
    console.log("validateForm", roomName);
    if (userName === '') {
      setIsUserNameInvalid(true);
      return false;
    } else if (roomName === '') {
      setIsRoomNameInvalid(true);
      return false;
    }
    return true;
  };

  const handleJoinClick = () => {
    if (validateForm()) {
      localStorage.setItem('username', userName);
      push(`room/${roomName}`);
    }
  };

  const onChangeRoomName = (e) => {
    const roomName = e.target.value;
    if (roomName === '' || roomName.trim() === '') {
      // Space detected
      setRoomName('');
      return;
    }
    setIsRoomNameInvalid(false);
    setRoomName(roomName);
  };

  const onChangeParticipantName = (e) => {
    const userName = e.target.value;
    if (userName === '' || userName.trim() === '') {
      // Space detected
      setUserName('');
      return;
    }
    setIsUserNameInvalid(false);
    setUserName(userName);
  };

  const onKeyDown = (e) => {
    if (e.keyCode === 13) {
      handleJoinClick();
    }
  };

  useEffect(() => {
    const publisherOptions = {
      publishAudio: defaultLocalAudio,
      publishVideo: defaultLocalVideo
    };
    if (waitingRoomVideoContainer.current) {
      initPublisher(waitingRoomVideoContainer.current.id, publisherOptions);
    }
  }, [initPublisher, defaultLocalAudio, defaultLocalVideo]);

  useEffect(() => {
    if (publisher) {
      publisher.publishAudio(localAudio);
    }
  }, [localAudio, publisher]);

  useEffect(() => {
    if (publisher) {
      publisher.publishVideo(localVideo);
    }
  }, [localVideo, publisher]);

  useEffect(() => {
    if (publisher && pubInitialised && deviceInfo) {
      const currentAudioDevice = publisher.getAudioSource();
      setAudioDevice(
        getAudioSourceDeviceId(deviceInfo.audioInputDevices, currentAudioDevice)
      );
      const currentVideoDevice = publisher.getVideoSource();
      setVideoDevice(currentVideoDevice.deviceId);

      OT.getActiveAudioOutputDevice().then((currentAudioOutputDevice) => {
        setAudioOutputDevice(currentAudioOutputDevice.deviceId);
      });
    }
  }, [
    deviceInfo,
    publisher,
    setAudioDevice,
    setVideoDevice,
    setAudioOutputDevice,
    pubInitialised
  ]);

  useEffect(() => {
    return () => {
      destroyPublisher();
    };
  }, [destroyPublisher]);

  useEffect(() => {
    setPreferences({
      defaultSettings: {
        publishAudio: localAudio,
        publishVideo: localVideo,
        audioSource: localAudioSource,
        videoSource: localVideoSource,
        audioOutput: localAudioOutput
      },
    });
  }, [
    localAudio,
    localVideo,
    setPreferences,
    localAudioSource,
    localVideoSource,
    localAudioOutput
  ]);

  return (
    <div className={classes.waitingRoomContainer}>
      <div
        className={classes.containerCenter}
      >
        <div
          id="waiting-room-video-container"
          className={classes.waitingRoomVideoPreview}
          ref={waitingRoomVideoContainer}
        >
          <form className={classes.form} noValidate>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="room-name"
              label="Room Name"
              name="roomName"
              autoComplete="Room Name"
              error={isRoomNameInvalid}
              autoFocus
              helperText={roomName === '' ? 'Empty Field' : ' '}
              value={roomName}
              onChange={onChangeRoomName}
              onKeyDown={onKeyDown}
            />
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              id="publisher-name"
              label="Name"
              name="name"
              error={isUserNameInvalid}
              required
              autoComplete="Name"
              helperText={userName === '' ? 'Empty Field' : ' '}
              value={userName}
              onChange={onChangeParticipantName}
              onKeyDown={onKeyDown}
            />
          </form>
          <div className={classes.deviceContainer}>
            <>
              <FormControl>
                <InputLabel id="demo-simple-select-label">
                  Select Audio Source
                </InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={audioDevice}
                  onChange={handleAudioSource}
                >
                  {deviceInfo.audioInputDevices.map((device) => (
                    <MenuItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <InputLabel id="video">Select Audio Output</InputLabel>
                {deviceInfo.audioOutputDevices && (
                  <Select
                    labelId="video"
                    id="demo-simple-select"
                    value={audioOutputDevice}
                    onChange={handleAudioOutput}
                    autoWidth={true}
                  >
                    {deviceInfo.audioOutputDevices.map((device) => (
                      <MenuItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </FormControl>
              <FormControl>
                <InputLabel id="video">Select Video Source</InputLabel>
                {deviceInfo.videoInputDevices && (
                  <Select
                    labelId="video"
                    id="demo-simple-select"
                    value={videoDevice}
                    onChange={handleVideoSource}
                  >
                    {deviceInfo.videoInputDevices.map((device) => (
                      <MenuItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </FormControl>
            </>
          </div>
          <div className={classes.deviceContainer}>
            <AudioSettings
              className={classes.deviceSettings}
              hasAudio={localAudio}
              onAudioChange={handleAudioChange}
            />
            <VideoSettings
              className={classes.deviceSettings}
              hasVideo={localVideo}
              onVideoChange={handleVideoChange}
            />
          </div>
        </div>
      </div>
      <div
        className={classes.containerCenter}
      >
        <Button variant="contained" color="secondary" onClick={handleJoinClick}>
          Join Call
        </Button>
      </div>
    </div>
  );
}
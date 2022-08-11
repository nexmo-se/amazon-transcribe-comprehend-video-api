// import MicIcon from '@material-ui/icons/Mic';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { IconButton } from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';

import ButtonGroup from '@material-ui/core/ButtonGroup';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import React from 'react';
import styles from './styles.js';

export default function MuteAudioButton({
  toggleAudio,
  hasAudio,
  classes,
  handleAudioChange,
}) {
  const title = hasAudio ? 'Disable Microphone' : 'Enable Microphone';
  const localClasses = styles();
  // console.log(classes);

  // const { deviceInfo } = useDevices();
  // const [devicesAvailable, setDevicesAvailable] = React.useState(null);
  // const [options, setOptions] = React.useState([]);
  // const [open, setOpen] = React.useState(false);
  // const anchorRef = React.useRef(null);
  // const [selectedIndex, setSelectedIndex] = React.useState(0);
  // const [audioDeviceId, setAudioDeviceId] = React.useState('');

  // React.useEffect(() => {
  //   setDevicesAvailable(deviceInfo.audioInputDevices);

  //   if (cameraPublishing && devicesAvailable) {
  //     getAudioSource().then((id) => setAudioDeviceId(id));

  //     const indexOfSelectedElement = devicesAvailable.indexOf(
  //       devicesAvailable.find((e) => e.deviceId === audioDeviceId)
  //     );

  //     setSelectedIndex(indexOfSelectedElement);
  //   }
  // }, [
  //   cameraPublishing,
  //   getAudioSource,
  //   deviceInfo,
  //   audioDeviceId,
  //   devicesAvailable
  // ]);

  // React.useEffect(() => {
  //   if (devicesAvailable) {
  //     const audioDevicesAvailable = devicesAvailable.map((e) => {
  //       return e.label;
  //     });
  //     setOptions(audioDevicesAvailable);
  //   }
  // }, [devicesAvailable]);

  // const handleChangeAudioSource = (event, index) => {
  //   setSelectedIndex(index);
  //   console.log(index);
  //   setOpen(false);
  //   const audioDeviceId = devicesAvailable.find(
  //     (device) => device.label === event.target.textContent
  //   ).deviceId;
  //   changeAudioSource(audioDeviceId);
  // };

  // const handleToggle = (e) => {
  //   setOpen((prevOpen) => !prevOpen);
  // };

  // const handleClose = (event) => {
  //   if (anchorRef.current && anchorRef.current.contains(event.target)) {
  //     return;
  //   }
  //   setOpen(false);
  // };

  return (
    <>
      <Tooltip title={title} aria-label="add">
        <IconButton
          edge="start"
          color="inherit"
          aria-label="mic"
          onClick={handleAudioChange}
          className={`${classes.toolbarButtons} ${
            !hasAudio ? classes.disabledButton : ''
          }
          `}
        >
          {!hasAudio ? (
            <MicOffIcon fontSize="large" />
          ) : (
            <MicIcon fontSize="large" />
          )}
        </IconButton>
      </Tooltip>
    </>
  );
}

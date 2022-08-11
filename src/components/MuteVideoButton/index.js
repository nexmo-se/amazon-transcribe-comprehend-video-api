import VideoCam from '@mui/icons-material/Videocam';
import VideocamOff from '@mui/icons-material/VideocamOff';
import { IconButton } from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';

import ButtonGroup from '@material-ui/core/ButtonGroup';
// import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import React from 'react';
import styles from './styles.js';

export default function MuteVideoButton({
  classes,
  hasVideo,
  handleVideoChange,
}) {
  const title = hasVideo ? 'Disable Camera' : 'Enable Camera';
  // console.log('[MuteVideoButton] - hasVideo', hasVideo);

  const [devicesAvailable, setDevicesAvailable] = React.useState(null);
  const [options, setOptions] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const localClasses = styles();

  // React.useEffect(() => {
  //   setDevicesAvailable(deviceInfo.videoInputDevices);

  //   if (cameraPublishing) {
  //     const currentDeviceId = getVideoSource()?.deviceId;

  //     const IndexOfSelectedElement = devicesAvailable.indexOf(
  //       devicesAvailable.find((e) => e.deviceId === currentDeviceId)
  //     );
  //     setSelectedIndex(IndexOfSelectedElement);
  //   }
  // }, [cameraPublishing, getVideoSource, deviceInfo]);

  // React.useEffect(() => {
  //   if (devicesAvailable) {
  //     const videoDevicesAvailable = devicesAvailable.map((e) => {
  //       return e.label;
  //     });
  //     setOptions(videoDevicesAvailable);
  //   }
  // }, [devicesAvailable]);

  // const handleChangeVideoSource = (event, index) => {
  //   setSelectedIndex(index);
  //   setOpen(false);
  //   const videoDeviceId = devicesAvailable.find(
  //     (device) => device.label === event.target.textContent
  //   ).deviceId;
  //   changeVideoSource(videoDeviceId);
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
          onClick={handleVideoChange}
          edge="start"
          aria-label="videoCamera"
          size="small"
          className={`${classes.arrowButton} ${
            !hasVideo ? classes.disabledButton : ''
          }`}
        >
          {!hasVideo ? (
            <VideocamOff fontSize="large" />
          ) : (
            <VideoCam fontSize="large" />
          )}
        </IconButton>
      </Tooltip>
    </>
  );
}

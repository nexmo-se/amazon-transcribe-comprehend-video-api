/**
 * For both audio and video
 * 
 * @param {*} inputDevices 
 * @param {*} currentSource 
 * @returns String toReturn
 */

// const getAudioSourceDeviceId = (audioInputDevices, currentAudioSource) => {
//   let toReturn = '';
//   console.log('getAudioSourceDeviceId', audioInputDevices, currentAudioSource);
//   if (!audioInputDevices || !currentAudioSource) {
//     return toReturn;
//   }
//   for (let i = 0; i < audioInputDevices.length; i += 1) {
//     if (audioInputDevices[i].label === currentAudioSource.label) {
//       toReturn = audioInputDevices[i].deviceId;
//       break;
//     }
//   }
//   return toReturn;
// };
// export { getAudioSourceDeviceId };

const getSourceDeviceId = (inputDevices, currentSource) => {
  let toReturn = '';
  console.log('getSourceDeviceId', inputDevices, currentSource);
  if (!inputDevices || !currentSource) {
    return toReturn;
  }
  for (let i = 0; i < inputDevices.length; i += 1) {
    if (inputDevices[i].label === currentSource.label) {
      toReturn = inputDevices[i].deviceId;
      break;
    }
  }
  return toReturn;
};

export { getSourceDeviceId };

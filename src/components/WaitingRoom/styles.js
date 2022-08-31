import { makeStyles } from '@material-ui/core/styles';
import { blueGrey, green, red } from '@material-ui/core/colors';
export default makeStyles((theme) => ({
  waitingRoomContainer: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    display: 'flex',
    flexDirection: 'column',
    transform: 'translate(-50%, -50%)',
    backgroundColor: blueGrey[100],
    padding: '10px 20px',
    borderRadius: 5,
    width: '360px'
  },
  waitingRoomVideoContainer: {
    width: '360px',
    height: '264px'
  },
  deviceContainer: {
    display: 'flex',
    flexDirection: 'column',
    margin: '5px 0'
  },
  deviceSettings: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  selectWidth: {
    width: '200px'
  },
  networkTestContainer: {
    display: 'flex',
    flexDirection: 'column',
    margin: '10px 5px'
  },
  flex: {
    display: 'flex'
  },
  green: {
    color: green[600]
  },
  red: {
    color: red[600]
  },
  containerCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '3px',
    flexDirection: 'column'
  }
}));
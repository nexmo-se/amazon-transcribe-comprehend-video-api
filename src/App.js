import logo from './logo.svg';
import './App.css';
import WaitingRoom from './components/WaitingRoom';
import Wrapper from './components/Wrapper';
import EndCall from './components/EndCall';

import { createTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import { UserContext } from './context/UserContext';
import { useMemo, useState } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import VirtualView from './components/VirtualView';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';

let primary = process.env.REACT_APP_PALETTE_PRIMARY || '#b779ff';
let secondary = process.env.REACT_APP_PALETTE_SECONDARY || '#d6219c';

const theme = () => {
  return createTheme({
    palette: {
      type: 'light',
      primary: {
        main: primary,
      },
      secondary: {
        main: secondary,
      },
      bodyBackground: {
        black: '#131415',
      },
      callBackground: {
        main: '#20262D',
      },
      toolbarBackground: {
        main: '#41464D',
      },
      activeButtons: {
        green: '#1C8731',
        red: '#D50F2C',
      },
    },
  });
};

function App() {
  const [preferences, setPreferences] = useState({
    name: null,
    defaultSettings: {},
    messages: [],
    renderId: null,
    archiveId: null,
    recording: false,
    sessionId: null,
  });
  const preferencesValue = useMemo(
    () => ({ preferences, setPreferences }),
    [preferences, setPreferences]
  );
  return (
    <ThemeProvider theme={theme()}>
      <Router>
        <UserContext.Provider value={preferencesValue}>
          <Switch>
            <Route exact path="/mta/:roomName/:sessionId/end">
              <EndCall />
            </Route>
            <ProtectedRoute exact path="/room/:roomName" component={Wrapper} />

            {/* <Route path="/videorti/virtualviewer/:roomName">
              <VirtualView />
            </Route> */}
            <Route path="/videorti/recorder/:roomName">
              <VirtualView />
            </Route>
            <Route path="/">
              <WaitingRoom />
            </Route>
            <Route path="*">
              <Redirect
                to={{
                  pathname: '/',
                }}
              />
            </Route>
          </Switch>
        </UserContext.Provider>
      </Router>
    </ThemeProvider>
  );
}

export default App;

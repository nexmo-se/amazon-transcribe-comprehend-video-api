import React, { useContext } from 'react';
import { Route, Redirect } from 'react-router-dom';

import { UserContext } from '../../context/UserContext';

const ProtectedRoute = ({ component: Component, ...rest }) => {
  const { preferences } = useContext(UserContext);
  const roomName = rest?.computedMatch?.params?.roomName;

  return (
    <Route
      {...rest}
      render={(props) =>
        !roomName ? (
          <Redirect
            to={{
              pathname: '/',
              //   state: { room: roomName },
            }}
          />
        ) : (
          <Component {...props} />
        )
      }
    />
  );
};

export default ProtectedRoute;

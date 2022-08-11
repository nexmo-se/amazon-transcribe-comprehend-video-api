import React from 'react';

import styles from './styles';

function Header() {
  const classes = styles();
  return (
    <div className={classes.header}>
      <img
        src={process.env.PUBLIC_URL + '/Vonage.png'}
        className="vonage-logo"
        alt="vonage-logo"
        style={{ height: 50, alignSelf: 'center' }}
      />
      <h3 className="text">Video Translation (Patent Pending)</h3>
    </div>
  );
}

export default Header;

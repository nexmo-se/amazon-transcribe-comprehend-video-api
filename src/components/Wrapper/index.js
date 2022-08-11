import Main from '../Main';
import styles from './styles.js';
import React from 'react';

function Wrapper() {
  const classes = styles();
  return (
    <div className={classes.flex}>
      <Main />
    </div>
  );
}

export default Wrapper;

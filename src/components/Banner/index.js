import React from 'react';
import styles from './styles';
import { useEffect } from 'react';

import RouterIcon from '@mui/icons-material/Router';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@material-ui/core/IconButton';

import Snackbar from '@material-ui/core/Snackbar';

export default function Banner({ wsStatus }) {
    const [open, setOpen] = React.useState(Boolean(wsStatus));
    const classes = styles({ wsStatus });

    const handleClose = reason => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    useEffect(() => {
        setOpen(Boolean(wsStatus));
        console.log('opening it');
    }, [wsStatus]);

    return (
        <div>
            <Snackbar
                className={classes.anchorOriginTopCenter}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center'
                }}
                ContentProps={{
                    classes: {
                        root: classes.root,
                        action: classes.action
                    }
                }}
                open={open}
                onClose={handleClose}
                message={
                    <div className={classes.snackBarContent}>

                        {wsStatus === 'disconnected'
                            ? 'Stopped streaming. Translations will stop'
                            : `${wsStatus}`}

                    </div>
                }
                action={
                    <IconButton
                        aria-label="close"
                        color="inherit"
                        size="small"
                        onClick={handleClose}
                    >
                        <CloseIcon fontSize="inherit" />
                    </IconButton>
                    // </div>
                }
            />
        </div>
    );
}

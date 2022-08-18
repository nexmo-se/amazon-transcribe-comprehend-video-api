import { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { useParams } from 'react-router';

import Banner from '../Banner';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import MedicationIcon from '@mui/icons-material/Medication';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import Typography from '@mui/material/Typography';
import ContactPageIcon from '@mui/icons-material/ContactPage';

function EntitiesList({ listOfEntities, entity }) {
  const getIcon = (entity) => {
    switch (entity) {
      case 'Medical Condition':
        return <MedicalInformationIcon />;
      case 'Medication':
        return <MedicationIcon />;
      case 'Anatomy':
        return <BloodtypeIcon />;
      case 'Treatments':
        return <VaccinesIcon />;
      case 'PII':
        return <ContactPageIcon />;
      default:
        return;
    }
  };

  const getBgColor = (entity) => {
    switch (entity) {
      case 'Medical Condition':
        return '#5cceff';
      case 'Medication':
        return '#f0e442';
      case 'Anatomy':
        return '#d185af';
      case 'Treatments':
        return '#4a9';
      case 'PII':
        return '#999';
      default:
        return;
    }
  };
  return (
    <List>
      <ListItem disablePadding>
        <ListItemIcon>{getIcon(entity)}</ListItemIcon>

        <Typography
          style={{ background: getBgColor(entity), padding: '5px' }}
          variant="h6"
          component="h6"
          gutterBottom
        >
          {entity}
        </Typography>
      </ListItem>
      <List
        sx={{
          width: '100%',
          padding: '5px',
          maxWidth: 360,
          bgcolor: 'background.paper',
        }}
      >
        {listOfEntities
          ? listOfEntities.map((e) => <ListItemText key={e} primary={e} />)
          : ''}
      </List>
    </List>
  );
}

export default EntitiesList;

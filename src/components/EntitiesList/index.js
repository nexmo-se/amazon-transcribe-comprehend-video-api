import { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { useParams } from 'react-router';

import Banner from '../Banner';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
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
  return (<>
    <List>
      <ListItem key={entity} disablePadding>
        <ListItemIcon>{getIcon(entity)}</ListItemIcon>
        
        <Typography
        style={{ background: getBgColor(entity), padding: '0px' }}
            variant="div"
            component="div"
            gutterBottom
          >
            {entity}
          </Typography>
        </ListItem>
    </List>
    <List sx={{
      pl:2,
      display: "flex",
      flexDirection: "column",
      maxHeight: 120,
      overflow: "hidden",
      overflowY: "scroll",
      bgcolor: 'background.paper'
    }}>
      {listOfEntities
        ? listOfEntities.map((e, i) => <div key={`${e.Text}-${i}`} >
          <ListItem disablePadding>
            <ListItemText primary={e.Text} />
          </ListItem>
          <Collapse in={true} timeout="auto" unmountOnExit sx={{pl:2}}>
          <List component="div" disablePadding>
          {e.concepts && e.concepts.length > 0?
            <Select value='0' size="small">
              {e.concepts.map((_e, _i) => 
                <MenuItem key={`item-${i}-${_i}`} value={_i} >
                  {`${_e.Code} | ${_e.Description} | ${_e.Score}`}
                </MenuItem>
                )}
            </Select>
            : ''}
            </List>
            </Collapse>
        </div>)
        : ''}
    </List>
  </>);
}

export default EntitiesList;

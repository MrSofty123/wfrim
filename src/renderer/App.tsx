import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';
import './App.css';
import SwipeableViews from 'react-swipeable-views';
import {Tabs, Tab, Box, Typography, useTheme, AppBar} from '@mui/material';
import {Inventory} from './components/inventory';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FullWidthTabs />} />
      </Routes>
    </Router>
  );
}

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}

function FullWidthTabs() {
  const theme = useTheme();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleChangeIndex = (index: number) => {
    setValue(index);
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', width: "100vw", height: "100vh"}}>
      <AppBar position="static">
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant="fullWidth"
          aria-label="full width tabs example"
        >
          <Tab label="Inventory" {...a11yProps(0)} />
          <Tab label="Hosting" {...a11yProps(1)} />
          <Tab label="Statistics" {...a11yProps(2)} />
          <Tab label="Settings" {...a11yProps(3)} />
        </Tabs>
      </AppBar>
      <SwipeableViews
        axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
        index={value}
        onChangeIndex={handleChangeIndex}
      >
        <TabPanel value={value} index={0} dir={theme.direction}>
          <Inventory/>
        </TabPanel>
        <TabPanel value={value} index={1} dir={theme.direction}>
          Hosting
        </TabPanel>
        <TabPanel value={value} index={2} dir={theme.direction}>
          Statistics
        </TabPanel>
        <TabPanel value={value} index={3} dir={theme.direction}>
          Settings
        </TabPanel>
      </SwipeableViews>
    </Box>
  );
}

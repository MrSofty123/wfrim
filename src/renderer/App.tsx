import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';
import './App.css';
import SwipeableViews from 'react-swipeable-views';
import {Tabs, Tab, Box, Typography, useTheme, AppBar, ThemeProvider, createTheme} from '@mui/material';
import Inventory from './components/inventory';
import Settings from './components/settings';
import Statistics from './components/statistics';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
  components: {
    MuiFormControlLabel: {
        styleOverrides: {
          label: {
            color: "white"
          }
        }
    },
    MuiButton: {
      styleOverrides: {
        textPrimary: {
          boxShadow: "none"
        },
        outlinedPrimary: {
          boxShadow: "none"
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        body1: {
          color: "white"
        }
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#6b6b6b #2b2b2b",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "#2b2b2b",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#6b6b6b",
            minHeight: 24,
            border: "3px solid #2b2b2b",
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
            backgroundColor: "#959595",
          },
          "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
            backgroundColor: "#959595",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#959595",
          },
          "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
            backgroundColor: "#2b2b2b",
          },
        },
      },
    }
  },
});

export default function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <Router>
        <Routes>
          <Route path="/" element={<FullWidthTabs />} />
        </Routes>
      </Router>
    </ThemeProvider>
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
          indicatorColor="primary"
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

          <div hidden={value !== 0} style={{overflowY:'scroll',maxHeight:"93%",padding:'10px'}}>
          <Inventory/>
          </div>
          <div hidden={value !== 1} style={{overflowY:'scroll',maxHeight:"93%",padding:'10px'}}>
          Hosting
          </div>
          <div hidden={value !== 2} style={{overflowY:'scroll',maxHeight:"93%",padding:'10px'}}>
          <Statistics/>
          </div>
          <div hidden={value !== 3} style={{overflowY:'scroll',maxHeight:"93%",padding:'10px'}}>
            <Settings/>
          </div>
    </Box>
  );
}

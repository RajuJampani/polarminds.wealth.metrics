import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  CssBaseline, 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CalculateIcon from '@mui/icons-material/Calculate';
import InsightsIcon from '@mui/icons-material/Insights';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CompoundCalculatorPage from './pages/CompoundCalculatorPage';
import PortfolioInsightsPage from './pages/PortfolioInsightsPage';
import ScrollToTopButton from './components/ScrollToTopButton';

const drawerWidth = 280;
const miniDrawerWidth = 64;

// Component to scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo(0, 0);
    
    // Also scroll the main content container to top
    const mainContent = document.querySelector('[data-main-content]');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      dark: '#764ba2'
    },
    secondary: {
      main: '#f50057'
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700
    }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#667eea',
          boxShadow: 'none'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid rgba(102, 126, 234, 0.1)'
        }
      }
    }
  }
});

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [hoverOpen, setHoverOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMouseEnter = () => {
    if (!drawerOpen) {
      setHoverOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setHoverOpen(false);
  };

  const isDrawerExpanded = drawerOpen || hoverOpen;

  const drawer = (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        minHeight: 64,
        cursor: !drawerOpen ? 'pointer' : 'default',
        borderBottom: '2px solid rgba(102, 126, 234, 0.15)',
        mb: 1
      }}
      onClick={!drawerOpen ? handleDrawerToggle : undefined}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          {isDrawerExpanded && (
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Wealth Metrics
            </Typography>
          )}
        </Box>
        {isDrawerExpanded && (
          <IconButton onClick={handleDrawerToggle} size="small">
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <List sx={{ pt: 1, px: 1 }}>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton 
            component={Link} 
            to="/"
            sx={{
              borderRadius: 2,
              minHeight: 48,
              justifyContent: isDrawerExpanded ? 'initial' : 'center',
              px: 2,
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.08)',
                transform: 'translateX(2px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 0, 
              mr: isDrawerExpanded ? 2 : 'auto',
              justifyContent: 'center'
            }}>
              <CalculateIcon sx={{ color: 'grey.600', fontSize: 24 }} />
            </ListItemIcon>
            {isDrawerExpanded && (
              <ListItemText 
                primary="Compound Calculator" 
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            )}
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton 
            component={Link} 
            to="/insights"
            sx={{
              borderRadius: 2,
              minHeight: 48,
              justifyContent: isDrawerExpanded ? 'initial' : 'center',
              px: 2,
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.08)',
                transform: 'translateX(2px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 0, 
              mr: isDrawerExpanded ? 2 : 'auto',
              justifyContent: 'center'
            }}>
              <InsightsIcon sx={{ color: 'grey.600', fontSize: 24 }} />
            </ListItemIcon>
            {isDrawerExpanded && (
              <ListItemText 
                primary="Portfolio Insights" 
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            )}
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Router>
      <ScrollToTop />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', height: '100vh' }}>
          {/* App Bar */}
          <AppBar
            position="fixed"
            sx={{
              width: `calc(100% - ${isDrawerExpanded ? drawerWidth : miniDrawerWidth}px)`,
            ml: `${isDrawerExpanded ? drawerWidth : miniDrawerWidth}px`,
              transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            }}
          >
            <Toolbar>
            </Toolbar>
          </AppBar>

          {/* Drawer */}
          <Drawer
            variant="permanent"
            anchor="left"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            sx={{
              width: isDrawerExpanded ? drawerWidth : miniDrawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: isDrawerExpanded ? drawerWidth : miniDrawerWidth,
                boxSizing: 'border-box',
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
                overflowX: 'hidden',
                zIndex: hoverOpen ? 1300 : 'auto',
              },
            }}
          >
            {drawer}
          </Drawer>

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              width: `calc(100% - ${isDrawerExpanded ? drawerWidth : miniDrawerWidth}px)`,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            }}
          >
            {/* Toolbar spacer */}
            <Toolbar />
            
            {/* Page Content */}
            <Box 
              data-main-content
              sx={{ 
                flexGrow: 1, 
                p: 3, 
                bgcolor: 'background.default',
                overflow: 'auto'
              }}
            >
              <Routes>
                <Route path="/" element={<CompoundCalculatorPage />} />
                <Route path="/insights" element={<PortfolioInsightsPage />} />
              </Routes>
            </Box>

            {/* Footer */}
            <Paper 
              component="footer" 
              elevation={0}
              sx={{ 
                mt: 'auto',
                py: 2, 
                px: 3,
                bgcolor: 'background.paper',
                borderTop: '1px solid rgba(102, 126, 234, 0.1)'
              }}
            >
              <Typography 
                variant="body2" 
                color="text.secondary" 
                align="center"
                sx={{ fontWeight: 500 }}
              >
                © 2024 Wealth Metrics. Built for smart financial planning.
              </Typography>
            </Paper>
          </Box>
          
          {/* Scroll to Top Button */}
          <ScrollToTopButton />
        </Box>
      </ThemeProvider>
    </Router>
  );
}
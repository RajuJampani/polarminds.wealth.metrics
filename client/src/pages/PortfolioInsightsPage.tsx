import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Container,
  ThemeProvider,
  createTheme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Assessment,
  Psychology,
  PieChart
} from '@mui/icons-material';


// Google Finance-inspired theme (matching CompoundCalculatorPage)
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1356,
      xl: 1420,
    },
  },
  palette: {
    primary: {
      main: '#1a73e8',
      light: '#4285f4',
      dark: '#1557b0',
    },
    secondary: {
      main: '#34a853',
      light: '#5bb974',
      dark: '#137333',
    },
    error: {
      main: '#ea4335',
      light: '#ff6659',
      dark: '#d33b2c',
    },
    warning: {
      main: '#fbbc04',
      light: '#fdd663',
      dark: '#f9ab00',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#202124',
      secondary: '#5f6368',
    },
    grey: {
      50: '#f8f9fa',
      100: '#f1f3f4',
      200: '#e8eaed',
      300: '#dadce0',
      400: '#bdc1c6',
      500: '#9aa0a6',
      600: '#80868b',
      700: '#5f6368',
      800: '#3c4043',
      900: '#202124',
    },
    success: {
      main: '#34a853',
      50: '#e8f5e8',
    },
  },
  typography: {
    fontFamily: '"Google Sans", "Roboto", "Arial", sans-serif',
    h1: {
      fontSize: '2.125rem',
      fontWeight: 400,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 400,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          border: '1px solid rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

const PortfolioInsightsPage: React.FC = () => {
  const portfolioSummary = {
    totalValue: 125750.50,
    totalGains: 18250.75,
    totalReturn: 16.9,
    monthlyChange: 2.4
  };

  const sectorAllocation = [
    { id: 1, name: 'Technology', value: 45, amount: 56587.73, color: '#667eea' },
    { id: 2, name: 'Healthcare', value: 25, amount: 31437.63, color: '#764ba2' },
    { id: 3, name: 'Finance', value: 15, amount: 18862.58, color: '#f093fb' },
    { id: 4, name: 'Energy', value: 10, amount: 12575.05, color: '#f5576c' },
    { id: 5, name: 'Others', value: 5, amount: 6287.51, color: '#4facfe' },
  ];

  const topPerformers = [
    { symbol: 'AAPL', name: 'Apple Inc.', return: 24.5, trend: 'up' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', return: 19.8, trend: 'up' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', return: 15.2, trend: 'up' },
    { symbol: 'TSLA', name: 'Tesla Inc.', return: -8.3, trend: 'down' },
  ];

  const insights = [
    {
      title: 'Diversification Score',
      value: 'Excellent',
      description: 'Your portfolio is well-diversified across sectors',
      icon: <PieChart />
    },
    {
      title: 'Risk Level',
      value: 'Moderate',
      description: 'Balanced risk profile with growth potential',
      icon: <Assessment />
    },
    {
      title: 'Rebalancing',
      value: 'Recommended',
      description: 'Consider rebalancing tech allocation',
      icon: <AccountBalance />
    }
  ];

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Container maxWidth={false} sx={{
          width: '100%'
        }}>
          {/* Header */}
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Typography variant="h1" component="h1" sx={{ 
              color: 'text.primary', 
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
            }}>
              Portfolio Insights
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}>
              AI-powered analysis of your investment portfolio
            </Typography>
          </Box>

          {/* Portfolio Summary Cards */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)' 
            }, 
            gap: { xs: 1.5, sm: 2 }, 
            mb: { xs: 2, md: 3 },
            alignItems: 'stretch'
          }}>
            <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Portfolio Value
                </Typography>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary', fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                  ${portfolioSummary.totalValue.toLocaleString()}
                </Typography>
              </Box>
            </Card>
            <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Gains
                </Typography>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main', fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                  ${portfolioSummary.totalGains.toLocaleString()}
                </Typography>
              </Box>
            </Card>
            <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Return
                </Typography>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main', fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                  {portfolioSummary.totalReturn}%
                </Typography>
              </Box>
            </Card>
            <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Monthly Change
                </Typography>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'secondary.main', fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                  +{portfolioSummary.monthlyChange}%
                </Typography>
              </Box>
            </Card>
          </Box>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              md: 'repeat(2, 1fr)' 
            }, 
            gap: { xs: 2, md: 3 }, 
            mb: { xs: 2, md: 3 }
          }}>
            {/* Sector Allocation */}
            <Card sx={{ p: { xs: 2, sm: 3 }, height: 'fit-content' }}>
              <Typography variant="h3" sx={{ fontWeight: 500, mb: 2, color: 'text.primary' }}>
                Sector Allocation
              </Typography>
              {sectorAllocation.map((sector) => (
                <Box key={sector.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>
                      {sector.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {sector.value}% (${sector.amount.toLocaleString()})
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={sector.value} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: sector.color,
                        borderRadius: 4
                      }
                    }}
                  />
                </Box>
              ))}
            </Card>

            {/* Top Performers */}
            <Card sx={{ p: { xs: 2, sm: 3 }, height: 'fit-content' }}>
              <Typography variant="h3" sx={{ fontWeight: 500, mb: 2, color: 'text.primary' }}>
                Top Performers
              </Typography>
              <List>
                {topPerformers.map((stock, index) => (
                  <React.Fragment key={stock.symbol}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                         {stock.trend === 'up' ? 
                           <TrendingUp sx={{ color: 'success.main' }} /> : 
                           <TrendingDown sx={{ color: 'error.main' }} />
                         }
                       </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {stock.symbol}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {stock.name}
                              </Typography>
                            </Box>
                            <Chip 
                              label={`${stock.return > 0 ? '+' : ''}${stock.return}%`}
                              size="small"
                              sx={{
                                backgroundColor: stock.return > 0 ? 'success.50' : 'rgba(234, 67, 53, 0.1)',
                                color: stock.return > 0 ? 'success.main' : 'error.main',
                                fontWeight: 600,
                                borderRadius: 1
                              }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < topPerformers.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Card>
          </Box>

          {/* Portfolio Insights */}
          <Box sx={{ mb: { xs: 2, md: 3 } }}>
            <Typography variant="h3" sx={{ fontWeight: 500, mb: 2, color: 'text.primary' }}>
              AI-Powered Insights
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                md: 'repeat(3, 1fr)' 
              }, 
              gap: { xs: 1.5, sm: 2 },
              alignItems: 'stretch'
            }}>
              {insights.map((insight, index) => (
                <Card key={index} sx={{ 
                  p: { xs: 2, sm: 3 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 120
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                     <Box sx={{ color: 'primary.main', mr: 1 }}>
                       {insight.icon}
                     </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {insight.title}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary', mb: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                      {insight.value}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {insight.description}
                  </Typography>
                </Card>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default PortfolioInsightsPage;
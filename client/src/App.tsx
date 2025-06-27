import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import CompoundCalculatorMUI from './components/CompoundCalculatorMUI';
import InteractiveChart from './components/InteractiveChart';
import {
  Transaction as SharedTransaction,
  CalculationResult,
  MarketDataResponse as MarketData,
  MarketIndexInfo as MarketIndex
} from './shared-types';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useRef } from 'react';
import { 
  CssBaseline, 
  Container, 
  Box, 
  Typography, 
  Alert, 
  Card,
  IconButton,
  Chip,
  Skeleton,
  Checkbox
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Delete as DeleteIcon,
  FileUpload as ImportIcon,
  FileDownload as ExportIcon,
  DeleteSweep as ClearAllIcon,
  CheckBox as CheckBoxIcon,
  Close as CloseIcon,
  SelectAll as SelectAllIcon,
  Deselect as DeselectIcon,
  Sort as SortIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import './App.css';

// Google Finance-inspired theme
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
          boxShadow: '0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15)',
          border: 'none',
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

// Extended Transaction interface with id for client-side management
interface Transaction extends SharedTransaction {
  id: string;
  description?: string;
}

// Legacy interface for backward compatibility
interface SP500Data {
  averageReturn: number;
  historicalData: Array<{
    year: number;
    return: number;
    returnPercentage: string;
  }>;
  lastUpdated: string;
}

function App() {
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const savedTransactions = localStorage.getItem('compound-calculator-transactions');
      return savedTransactions ? JSON.parse(savedTransactions) : [];
    } catch (error) {
      console.error('Error loading transactions from localStorage:', error);
      return [];
    }
  });
  const [sp500Data, setSP500Data] = useState<SP500Data | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // New state for multi-index support
  const [availableIndices, setAvailableIndices] = useState<MarketIndex[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<string[]>(['sp500']); // Default to S&P 500
  const [marketDataCache, setMarketDataCache] = useState<Record<string, MarketData>>({});
  const [primaryIndex, setPrimaryIndex] = useState<string>('sp500'); // For calculations
  const hasCalculatedRef = useRef(false);
  
  // Bulk delete functionality
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  
  // Transaction filtering
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  
  // Cache for calculation results to avoid recalculating with same inputs
  const calculationCacheRef = useRef<Map<string, CalculationResult>>(new Map());
  const marketDataCacheRef = useRef<Map<string, { data: MarketData; timestamp: number }>>(new Map());
  
  // Cache expiry time (5 minutes)
  const CACHE_EXPIRY_MS = 5 * 60 * 1000;

  // Temporary stats for display next to main header
  const [tempStats, setTempStats] = useState<any>(null);

  // Format currency function
  const formatCurrency = useCallback((value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('compound-calculator-transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions to localStorage:', error);
    }
  }, [transactions]);



  // Memoized calculations to prevent unnecessary recalculations
  const totalWithdrawals = useMemo(() => {
    return transactions
      .filter(transaction => transaction.type === 'withdrawal')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [transactions]);
  
  const totalDeposits = useMemo(() => {
    return transactions
      .filter(transaction => transaction.type === 'deposit')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [transactions]);
  
  // Generate cache key for calculation results
  const generateCalculationCacheKey = useCallback((formData: {
    initialAmount: number;
    transactions: Transaction[];
    startDate: string;
    endDate: string;
  }, marketIndex: string) => {
    const transactionHash = formData.transactions
      .map(t => `${t.date}-${t.amount}-${t.type}`)
      .sort()
      .join('|');
    return `${formData.initialAmount}-${transactionHash}-${formData.startDate}-${formData.endDate}-${marketIndex}`;
  }, []);
  
  // Check if market data cache is valid
  const isMarketDataCacheValid = useCallback((index: string) => {
    const cached = marketDataCacheRef.current.get(index);
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_EXPIRY_MS;
  }, [CACHE_EXPIRY_MS]);

  // Cache cleanup function
  const cleanupExpiredCache = useCallback(() => {
    const now = Date.now();
    const entries = Array.from(marketDataCacheRef.current.entries());
    for (const [key, value] of entries) {
      if (now - value.timestamp > CACHE_EXPIRY_MS) {
        marketDataCacheRef.current.delete(key);
      }
    }
  }, [CACHE_EXPIRY_MS]);
  
  // Optimized sort transactions function
  const handleSortTransactions = useCallback(() => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);
  }, [sortOrder]);

  // Fetch available market indices
  const fetchAvailableIndices = async () => {
    try {
      const response = await axios.get('/api/market-indices');
      setAvailableIndices(response.data);
    } catch (err) {
      console.error('Error fetching market indices:', err);
      // Set fallback data (must match server MARKET_INDICES exactly)
      setAvailableIndices([
        { id: 'sp500', name: 'S&P 500', averageReturn: 0.10 },
        { id: 'nasdaq', name: 'NASDAQ', averageReturn: 0.115 },
        { id: 'dow', name: 'Dow Jones', averageReturn: 0.095 },
        { id: 'russell2000', name: 'Russell 2000', averageReturn: 0.092 },
        { id: 'ftse100', name: 'FTSE 100', averageReturn: 0.075 },
        { id: 'nikkei225', name: 'Nikkei 225', averageReturn: 0.085 }
      ]);
    }
  };

  // Optimized fetch market data with smart caching
  const fetchMarketData = useCallback(async (index: string, startDate?: string, endDate?: string) => {
    const cacheKey = `${index}-${startDate || 'all'}-${endDate || 'all'}`;
    
    // Check if we have valid cached data
    if (isMarketDataCacheValid(cacheKey)) {
      const cached = marketDataCacheRef.current.get(cacheKey);
      if (cached) {
        // Update state cache if not already present
        setMarketDataCache(prev => {
          if (!prev[index]) {
            return {
              ...prev,
              [index]: cached.data
            };
          }
          return prev;
        });
        return cached.data;
      }
    }
    
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await axios.get(`/api/market-data/${index}?${params.toString()}`);
      const data = response.data;
      
      // Cache the data with timestamp
      marketDataCacheRef.current.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      setMarketDataCache(prev => ({
        ...prev,
        [index]: data
      }));
      
      return data;
    } catch (err) {
      console.error(`Error fetching ${index} data:`, err);
      return null;
    }
  }, [isMarketDataCacheValid]);

  // Fetch S&P 500 data (for backward compatibility)
  const fetchSP500Data = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await axios.get(`/api/sp500-data?${params.toString()}`);
      setSP500Data(response.data);
    } catch (err) {
      console.error('Error fetching S&P 500 data:', err);
      // Set fallback data
      setSP500Data({
        lastUpdated: new Date().toISOString(),
        averageReturn: 10.0,
        historicalData: []
      });
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchAvailableIndices(),
        fetchSP500Data()
      ]);
      setInitialLoading(false);
    };
    
    initializeData();
  }, []);
  
  // Periodic cache cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      cleanupExpiredCache();
    }, CACHE_EXPIRY_MS);
    
    return () => clearInterval(interval);
  }, [cleanupExpiredCache, CACHE_EXPIRY_MS]);
  
  // Periodic market data refresh for real-time updates
  useEffect(() => {
    const MARKET_DATA_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    const interval = setInterval(() => {
      // Refresh market indices data
      fetchAvailableIndices();
      
      // Refresh market data for current primary index if we have calculation data
      if (calculationResult && primaryIndex) {
        const startDate = calculationResult.yearlyData?.[0]?.year?.toString();
        const endDate = new Date().getFullYear().toString();
        if (startDate) {
          fetchMarketData(primaryIndex, startDate, endDate);
        }
      }
    }, MARKET_DATA_REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [fetchMarketData, calculationResult, primaryIndex]);

  // Optimized fetch market data for selected indices with smart caching
  useEffect(() => {
    const fetchSelectedIndicesData = async () => {
      const promises = selectedIndices
        .filter(index => {
          // Only fetch if not in state cache and not in memory cache (or expired)
          return !marketDataCache[index] && !isMarketDataCacheValid(index);
        })
        .map(index => fetchMarketData(index));
      
      if (promises.length > 0) {
        await Promise.all(promises);
      }
    };
    
    if (selectedIndices.length > 0) {
      fetchSelectedIndicesData();
    }
  }, [selectedIndices, fetchMarketData, isMarketDataCacheValid]);





  // Memoized sorted and filtered transactions
  const sortedTransactions = useMemo(() => {
    const filtered = transactionTypeFilter === 'all' 
      ? transactions 
      : transactions.filter(t => t.type === transactionTypeFilter);
    
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [transactions, sortOrder, transactionTypeFilter]);
  
  const handleTransactionsChange = useCallback((newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
  }, []);

  // Memoized transaction date calculations
  const transactionDateRange = useMemo(() => {
    if (transactions.length === 0) return null;
    
    const firstTransaction = transactions.reduce((earliest, transaction) => 
      new Date(transaction.date) < new Date(earliest.date) ? transaction : earliest
    );
    const lastTransaction = transactions.reduce((latest, transaction) => 
      new Date(transaction.date) > new Date(latest.date) ? transaction : latest
    );
    
    return {
      startDate: firstTransaction.date,
      endDate: lastTransaction.date,
      firstTransaction,
      lastTransaction
    };
  }, [transactions]);
  
  const removeTransaction = useCallback((index: number) => {
    const updatedTransactions = transactions.filter((_, i) => i !== index);
    setTransactions(updatedTransactions);
    
    // Clear calculation cache since transactions changed
    calculationCacheRef.current.clear();
    
    // Note: Recalculation will be triggered automatically by the useEffect
    // when transactions change, so we don't need to manually trigger it here
  }, [transactions]);

  // Bulk delete functions
  const toggleSelectMode = useCallback(() => {
    setIsSelectMode(prev => !prev);
    setSelectedTransactionIds(new Set());
  }, []);

  const toggleTransactionSelection = useCallback((transactionId: string) => {
    setSelectedTransactionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  }, []);

  const selectAllTransactions = useCallback(() => {
    const filteredIds = new Set(sortedTransactions.map(t => t.id));
    setSelectedTransactionIds(filteredIds);
  }, [sortedTransactions]);

  const deselectAllTransactions = useCallback(() => {
    setSelectedTransactionIds(new Set());
  }, []);

  const deleteSelectedTransactions = useCallback(() => {
    const updatedTransactions = transactions.filter(t => !selectedTransactionIds.has(t.id));
    setTransactions(updatedTransactions);
    setSelectedTransactionIds(new Set());
    setIsSelectMode(false);
    
    // Clear calculation cache since transactions changed
    calculationCacheRef.current.clear();
  }, [transactions, selectedTransactionIds]);

  const clearAllTransactions = useCallback(() => {
    setTransactions([]);
    setSelectedTransactionIds(new Set());
    setIsSelectMode(false);
    setCalculationResult(null);
    
    // Clear calculation cache since transactions changed
    calculationCacheRef.current.clear();
  }, []);

  const exportTransactions = useCallback(() => {
    const csvHeader = 'date,amount,type\n';
    const csvData = transactions.map(t => `${t.date},${t.amount},${t.type}`).join('\n');
    const csvContent = csvHeader + csvData;
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [transactions]);

  const importTransactions = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const csvContent = e.target?.result as string;
            const lines = csvContent.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
              alert('Invalid CSV file. File must contain header and at least one transaction.');
              return;
            }
            
            const header = lines[0].toLowerCase();
            if (!header.includes('date') || !header.includes('amount') || !header.includes('type')) {
              alert('Invalid CSV format. File must contain date, amount, and type columns.');
              return;
            }
            
            const importedTransactions = lines.slice(1).map(line => {
              const [date, amount, type] = line.split(',').map(field => field.trim());
              return {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                date,
                amount: parseFloat(amount),
                type: type as 'deposit' | 'withdrawal'
              };
            });
            
            setTransactions(importedTransactions);
            setSelectedTransactionIds(new Set());
            setIsSelectMode(false);
            
            // Clear calculation cache since transactions changed
            calculationCacheRef.current.clear();
            
            // Force immediate recalculation with imported transactions
            if (importedTransactions.length > 0) {
              const sortedTransactions = [...importedTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              const startDate = sortedTransactions[0].date;
              const endDate = new Date().toISOString().split('T')[0];
              
              calculateCompound({
                initialAmount: 0,
                transactions: importedTransactions,
                startDate,
                endDate
              });
            }
          } catch (error) {
            alert('Error reading file. Please select a valid CSV file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  const calculateCompound = useCallback(async (formData: {
    initialAmount: number;
    transactions: Transaction[];
    startDate: string;
    endDate: string;
  }) => {
    // Generate cache key for this calculation
    const cacheKey = generateCalculationCacheKey(formData, primaryIndex);
    
    // Check if we have cached result for this exact calculation
    const cachedResult = calculationCacheRef.current.get(cacheKey);
    if (cachedResult) {
      setCalculationResult(cachedResult);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch updated market data for the primary index (with caching)
      await fetchMarketData(primaryIndex, formData.startDate, formData.endDate);
      // Also fetch S&P 500 data for backward compatibility
      await fetchSP500Data(formData.startDate, formData.endDate);
      
      const response = await axios.post('/api/calculate-compound', {
        ...formData,
        marketIndex: primaryIndex
      });
      
      const result = response.data;
      
      // Cache the calculation result
      calculationCacheRef.current.set(cacheKey, result);
      
      // Limit cache size to prevent memory issues (keep last 50 calculations)
      if (calculationCacheRef.current.size > 50) {
        const keys = Array.from(calculationCacheRef.current.keys());
        const firstKey = keys[0];
        if (firstKey) {
          calculationCacheRef.current.delete(firstKey);
        }
      }
      
      setCalculationResult(result);
    } catch (err) {
      console.error('Error calculating compound interest:', err);
      setError('Calculation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [primaryIndex, generateCalculationCacheKey, fetchMarketData, fetchSP500Data]);

  // Unified calculation effect to prevent race conditions
  useEffect(() => {
    if (transactions.length === 0) {
      // Clear results when no transactions
      setCalculationResult(null);
      hasCalculatedRef.current = false;
      return;
    }

    // Only calculate if we have all required data
    if (transactions.length > 0 && sp500Data && !initialLoading && transactionDateRange) {
      const dateRange = transactionDateRange;
      
      calculateCompound({
        initialAmount: 0,
        transactions,
        startDate: dateRange.startDate,
        endDate: new Date().toISOString().split('T')[0]
      });
      
      hasCalculatedRef.current = true;
    }
  }, [transactions, transactionDateRange, calculateCompound, sp500Data, initialLoading, primaryIndex]);

  // Optimized market index selection functions
  const setPrimaryMarketIndex = useCallback((indexId: string) => {
    // Batch state updates to prevent double renders
    React.startTransition(() => {
      setPrimaryIndex(indexId);
      // Ensure the primary index is selected
      setSelectedIndices(prev => {
        if (!prev.includes(indexId)) {
          return [...prev, indexId];
        }
        return prev;
      });
    });
    
    // Clear calculation cache when primary index changes
    calculationCacheRef.current.clear();
  }, []);
  
  const toggleMarketIndex = useCallback((indexId: string) => {
    // Always set the clicked index as primary (this will also add it to selection)
    setPrimaryMarketIndex(indexId);
  }, [setPrimaryMarketIndex]);

  // Memoize default chart data to prevent unnecessary re-renders
  const defaultChartData = useMemo(() => ({
    summary: {
      finalAmount: 0,
      totalContributions: 0,
      totalGains: 0,
      totalROI: 0,
      averageAnnualReturn: '0%',
      investmentPeriod: {
        startDate: '',
        endDate: '',
        totalMonths: 0
      }
    },
    monthlyData: [],
    yearlyData: []
  }), []);

  // Memoize chart props to prevent unnecessary re-renders
  const chartData = useMemo(() => calculationResult || defaultChartData, [calculationResult, defaultChartData]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Container maxWidth="xl" sx={{ 
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 2, sm: 3 }
      }}>
          {/* Header */}
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h1" component="h1" sx={{ 
                  color: 'text.primary', 
                  mb: 1,
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
                }}>
                  Investment Calculator
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}>
                  Calculate returns with real market historical data
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {availableIndices.map((index) => (
                  <Box key={index.id} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    px: 2, 
                    py: 1, 
                    bgcolor: 'grey.50', 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: 'success.main' 
                    }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {index.name}: {(index.averageReturn * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Main Content Layout */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              md: '1fr', 
              lg: '2fr 1fr' 
            }, 
            gap: { xs: 2, md: 3 }, 
            alignItems: 'stretch' 
          }}>
            {/* Left Column - Add Transactions (lg+) & Results */}
            <Box>
              {/* Add Transactions - Desktop Only */}
              <Box sx={{ display: { xs: 'none', lg: 'block' }, mb: 3 }}>
                <CompoundCalculatorMUI
                  onCalculate={calculateCompound}
                  onTransactionsChange={handleTransactionsChange}
                  loading={loading}
                  sp500Data={sp500Data}
                  transactions={transactions}
                />
              </Box>

              {/* Error Message */}
              {error && (
                <Box sx={{ mt: 3 }}>
                  <Alert severity="error">
                    ⚠️ {error}
                  </Alert>
                </Box>
              )}

              {/* Results Section */}
              {initialLoading || (loading && !calculationResult) ? (
                <Box sx={{ mt: 4 }}>
                  {/* Skeleton for Market Indices Section */}
                  <Card sx={{ p: 3, mb: 3, minHeight: 160 }}>
                    <Box sx={{ mb: 2 }}>
                      <Skeleton variant="text" width={150} height={26} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width={480} height={22} sx={{ mb: 2 }} />
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, minHeight: 30 }}>
                      <Skeleton variant="rounded" width={75} height={28} />
                      <Skeleton variant="rounded" width={90} height={28} />
                      <Skeleton variant="rounded" width={100} height={28} />
                      <Skeleton variant="rounded" width={85} height={28} />
                      <Skeleton variant="rounded" width={80} height={28} />
                      <Skeleton variant="rounded" width={95} height={28} />
                    </Box>
                    <Skeleton variant="text" width={380} height={20} />
                  </Card>

                  {/* Skeleton for Investment Activity Section */}
                  <Box sx={{ mb: 3 }}>
                    <Skeleton variant="text" width={220} height={28} sx={{ mb: 2 }} />
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { 
                        xs: '1fr', 
                        sm: 'repeat(2, 1fr)' 
                      }, 
                      gap: { xs: 1.5, sm: 2 }, 
                      mb: 3,
                      alignItems: 'stretch'
                    }}>
                      <Card sx={{ p: { xs: 2, sm: 3 }, height: 'fit-content', display: 'flex', flexDirection: 'column', minHeight: 110 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Skeleton variant="text" width={120} height={14} />
                          <Skeleton variant="circular" width={6} height={6} />
                        </Box>
                        <Skeleton variant="text" width={180} height={32} sx={{ mb: 0.5 }} />
                        <Skeleton variant="text" width={140} height={18} />
                      </Card>
                      <Card sx={{ p: { xs: 2, sm: 3 }, height: 'fit-content', display: 'flex', flexDirection: 'column', minHeight: 110 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Skeleton variant="text" width={120} height={14} />
                          <Skeleton variant="circular" width={6} height={6} />
                        </Box>
                        <Skeleton variant="text" width={180} height={32} sx={{ mb: 0.5 }} />
                        <Skeleton variant="text" width={140} height={18} />
                      </Card>
                    </Box>
                  </Box>
                  
                  {/* Skeleton for Performance Section */}
                  <Box sx={{ mb: 3 }}>
                    <Skeleton variant="text" width={200} height={28} sx={{ mb: 2 }} />
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { 
                        xs: '1fr', 
                        sm: 'repeat(2, 1fr)',
                        lg: 'repeat(4, 1fr)' 
                      }, 
                      gap: { xs: 1.5, sm: 2 }, 
                      mb: 3,
                      alignItems: 'stretch'
                    }}>
                      <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Skeleton variant="text" width={100} height={14} />
                          <Skeleton variant="rectangular" width={40} height={22} sx={{ borderRadius: 1 }} />
                        </Box>
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Skeleton variant="text" width={160} height={32} />
                        </Box>
                        <Skeleton variant="text" width={120} height={18} />
                      </Card>
                      <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Skeleton variant="text" width={100} height={14} />
                          <Skeleton variant="rectangular" width={40} height={22} sx={{ borderRadius: 1 }} />
                        </Box>
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Skeleton variant="text" width={160} height={32} />
                        </Box>
                        <Skeleton variant="text" width={120} height={18} />
                      </Card>
                      <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Skeleton variant="text" width={100} height={14} />
                          <Skeleton variant="rectangular" width={40} height={22} sx={{ borderRadius: 1 }} />
                        </Box>
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Skeleton variant="text" width={140} height={32} />
                        </Box>
                        <Skeleton variant="text" width={100} height={18} />
                      </Card>
                      <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 120 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Skeleton variant="text" width={100} height={14} />
                          <Skeleton variant="rectangular" width={40} height={22} sx={{ borderRadius: 1 }} />
                        </Box>
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Skeleton variant="text" width={120} height={32} />
                        </Box>
                        <Skeleton variant="text" width={160} height={18} />
                      </Card>
                    </Box>
                   </Box>
                 </Box>
               ) : (calculationResult || transactions.length === 0) && (
                 <Box sx={{ mt: { xl: 4 } }}>
                  {/* Market Index Selection */}
                  {availableIndices.length > 0 && (
                    <Card sx={{ p: 3, mb: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h3" sx={{ color: 'text.primary', mb: 1 }}>
                          Market Indices
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                          Select indices to display on the chart. The primary index is used for calculations.
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {availableIndices.map((index) => (
                          <Chip
                            key={index.id}
                            label={index.name}
                            variant={selectedIndices.includes(index.id) ? 'filled' : 'outlined'}
                            color={index.id === primaryIndex ? 'primary' : 'default'}
                            onClick={() => toggleMarketIndex(index.id)}
                            onDelete={index.id === primaryIndex ? () => {} : undefined}
                            deleteIcon={index.id === primaryIndex ? <TrendingUpIcon /> : undefined}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: index.id === primaryIndex ? 'primary.light' : 'grey.100'
                              },
                              ...(index.id === primaryIndex && {
                                fontWeight: 600,
                                border: '2px solid',
                                borderColor: 'primary.main'
                              })
                            }}
                          />
                        ))}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        Primary index for calculations: <strong>{availableIndices.find(i => i.id === primaryIndex)?.name || 'S&P 500'}</strong>
                        {' '}(Click any index to make it primary)
                      </Typography>
                    </Card>
                  )}

                  {/* Enhanced Summary Cards */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h3" sx={{ color: 'text.primary', mb: 2 }}>
                      Investment Activity
                    </Typography>
                    <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { 
                      xs: '1fr', 
                      sm: 'repeat(2, 1fr)' 
                    }, 
                    gap: { xs: 1.5, sm: 2 }, 
                    mb: 3,
                    alignItems: 'stretch'
                  }}>
                    <Card sx={{ p: { xs: 2, sm: 3 }, height: 'fit-content', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Deposited
                        </Typography>
                        <Box sx={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: '50%', 
                          bgcolor: 'success.main' 
                        }} />
                      </Box>
                      <Typography variant="h2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                        ${(calculationResult?.summary?.totalDeposits || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        All money invested
                      </Typography>
                    </Card>

                    <Card sx={{ p: { xs: 2, sm: 3 }, height: 'fit-content', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Withdrawn
                        </Typography>
                        <Box sx={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: '50%', 
                          bgcolor: 'warning.main' 
                        }} />
                      </Box>
                      <Typography variant="h2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                        ${totalWithdrawals.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        All money withdrawn
                      </Typography>
                    </Card>
                  </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h3" sx={{ color: 'text.primary', mb: 2 }}>
                      Current Position
                    </Typography>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { 
                        xs: '1fr', 
                        sm: 'repeat(2, 1fr)',
                        lg: 'repeat(4, 1fr)' 
                      }, 
                      gap: { xs: 1.5, sm: 2 }, 
                      mb: 3,
                      alignItems: 'stretch' 
                    }}>
                      <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Portfolio Value
                          </Typography>
                          <Box sx={{ 
                            width: 6, 
                            height: 6, 
                            borderRadius: '50%', 
                            bgcolor: 'primary.main' 
                          }} />
                        </Box>
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="h2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            ${(calculationResult?.summary?.finalAmount || 0).toLocaleString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Current value of investments
                        </Typography>
                      </Card>

                      <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Net Investment
                          </Typography>
                          <Box sx={{ 
                            width: 6, 
                            height: 6, 
                            borderRadius: '50%', 
                            bgcolor: 'grey.400' 
                          }} />
                        </Box>
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="h2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            ${(calculationResult?.summary?.netInvestment || 0).toLocaleString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Deposits minus withdrawals
                        </Typography>
                      </Card>

                      <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Net Gains
                          </Typography>
                          <Box sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: (calculationResult?.summary?.netGains || 0) >= 0 ? 'success.50' : 'error.50',
                            borderRadius: 1,
                            px: 1,
                            py: 0.5
                          }}>
                            {(calculationResult?.summary?.netGains || 0) >= 0 ? (
                              <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                            ) : (
                              <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="h2" sx={{ 
                            fontWeight: 700, 
                            color: (calculationResult?.summary?.netGains || 0) >= 0 ? 'success.main' : 'error.main'
                          }}>
                            {(calculationResult?.summary?.netGains || 0) >= 0 ? '+' : ''}${(calculationResult?.summary?.netGains || 0).toLocaleString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Market gains/losses
                        </Typography>
                      </Card>

                      <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Net Return
                          </Typography>
                          <Box sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: (calculationResult?.summary?.netROI || 0) >= 0 ? 'success.50' : 'error.50',
                            borderRadius: 1,
                            px: 1,
                            py: 0.5
                          }}>
                            {(calculationResult?.summary?.netROI || 0) >= 0 ? (
                              <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                            ) : (
                              <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="h2" sx={{ 
                            fontWeight: 700, 
                            color: (calculationResult?.summary?.netROI || 0) >= 0 ? 'success.main' : 'error.main'
                          }}>
                            {(calculationResult?.summary?.netROI || 0) >= 0 ? '+' : '-'}{Math.abs(calculationResult?.summary?.netROI || 0).toFixed(1)}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Return on net investment
                        </Typography>
                      </Card>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Right Column - Add Transactions & Transaction History */}
            <Box sx={{ 
              position: 'static',
              order: { xs: -1, lg: 0 },
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 2, sm: 3 },
              mb: { xl: 3 },
            }}>
              {/* Add Transactions - Mobile/Tablet Only */}
              <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
                <Card sx={{ 
                  p: { xs: 2, sm: 3 }, 
                  height: 'fit-content'
                }}>
                  <CompoundCalculatorMUI
                onCalculate={calculateCompound}
                onTransactionsChange={handleTransactionsChange}
                loading={loading}
                sp500Data={sp500Data}
                compact={true}
                transactions={transactions}
              />
                </Card>
              </Box>
              
              {/* Transaction History */}
              <Card sx={{ 
                p: { xs: 2, sm: 3 }, 
                height: '100%',
                maxHeight: { xs: 800, lg: 1044, xl: 992 },
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  flexDirection: 'column',
                  gap: 2,
                  mb: 2
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    width: '100%',
                    flexWrap: 'wrap',
                    gap: 1
                  }}>
                    <Typography variant="h3" sx={{ color: 'text.primary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      Transaction History ({transactions.length})
                    </Typography>
                    
                    {/* Action Icons - Reorganized */}
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Import/Export Group */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 0.5, 
                        mr: 1,
                        p: 0.5,
                        borderRadius: 1,
                        bgcolor: 'grey.50',
                        border: '1px solid',
                        borderColor: 'grey.200'
                      }}>
                        <IconButton
                          size="small"
                          sx={{ color: 'primary.main' }}
                          title="Import transactions"
                          onClick={importTransactions}
                        >
                          <ImportIcon fontSize="small" />
                        </IconButton>
                        {transactions.length > 0 && (
                          <IconButton
                            size="small"
                            sx={{ color: 'primary.main' }}
                            title="Export transactions"
                            onClick={exportTransactions}
                          >
                            <ExportIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      
                      {/* Filter and Sort Group */}
                      {transactions.length > 0 && (
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 0.5, 
                          mr: 1,
                          p: 0.5,
                          borderRadius: 1,
                          bgcolor: 'grey.50',
                          border: '1px solid',
                          borderColor: 'grey.200'
                        }}>
                          <IconButton
                            size="small"
                            sx={{ 
                              color: transactionTypeFilter !== 'all' ? 'secondary.main' : 'primary.main'
                            }}
                            title="Filter by transaction type"
                            onClick={() => {
                              const nextFilter = transactionTypeFilter === 'all' ? 'deposit' : 
                                               transactionTypeFilter === 'deposit' ? 'withdrawal' : 'all';
                              setTransactionTypeFilter(nextFilter);
                            }}
                          >
                            <FilterIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{ color: 'primary.main' }}
                            title={`Sort transactions (currently ${sortOrder === 'desc' ? 'newest first' : 'oldest first'} - click to toggle)`}
                            onClick={handleSortTransactions}
                          >
                            <SortIcon fontSize="small" sx={{ 
                               transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                               transition: 'transform 0.2s ease'
                             }} />
                          </IconButton>
                        </Box>
                      )}
                      
                      {/* Selection Group */}
                      {transactions.length > 0 && (
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 0.5, 
                          mr: 1,
                          p: 0.5,
                          borderRadius: 1,
                          bgcolor: isSelectMode ? 'secondary.50' : 'grey.50',
                          border: '1px solid',
                          borderColor: isSelectMode ? 'secondary.200' : 'grey.200'
                        }}>
                          <IconButton
                            size="small"
                            sx={{ color: isSelectMode ? 'secondary.main' : 'primary.main' }}
                            title={isSelectMode ? "Exit select mode" : "Select transactions"}
                            onClick={toggleSelectMode}
                          >
                            {isSelectMode ? <CloseIcon fontSize="small" /> : <CheckBoxIcon fontSize="small" />}
                          </IconButton>
                          {isSelectMode && (
                            <>
                              <IconButton
                                size="small"
                                sx={{ color: 'primary.main' }}
                                title="Select all"
                                onClick={selectAllTransactions}
                              >
                                <SelectAllIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                sx={{ color: 'primary.main' }}
                                title="Deselect all"
                                onClick={deselectAllTransactions}
                              >
                                <DeselectIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                sx={{ color: 'error.main' }}
                                title={`Delete selected (${selectedTransactionIds.size})`}
                                onClick={deleteSelectedTransactions}
                                disabled={selectedTransactionIds.size === 0}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      )}
                      
                      {/* Clear All - Separate */}
                      {transactions.length > 0 && (
                        <IconButton
                          size="small"
                          sx={{ color: 'error.main' }}
                          title="Clear all transactions"
                          onClick={clearAllTransactions}
                        >
                          <ClearAllIcon fontSize="small" />
                        </IconButton>
                        )}
                     </Box>
                   </Box>
                   
                   {/* Filter Indicator */}
                   {transactionTypeFilter !== 'all' && (
                     <Box sx={{ 
                       display: 'flex', 
                       alignItems: 'center', 
                       gap: 1,
                       px: 1,
                       py: 0.5,
                       bgcolor: 'secondary.50',
                       borderRadius: 1,
                       border: '1px solid',
                       borderColor: 'secondary.200'
                     }}>
                       <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 600 }}>
                         Showing {transactionTypeFilter}s only
                       </Typography>
                       <Chip 
                         label={`${sortedTransactions.length} of ${transactions.length}`}
                         size="small"
                         color="secondary"
                         variant="outlined"
                       />
                       <IconButton
                         size="small"
                         sx={{ color: 'secondary.main', ml: 0.5 }}
                         title="Clear filter"
                         onClick={() => setTransactionTypeFilter('all')}
                       >
                         <CloseIcon fontSize="small" />
                       </IconButton>
                     </Box>
                   )}
                 </Box>
                <Box sx={{ 
                  flex: 1,
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#c1c1c1',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#a8a8a8',
                  },
                }}>
                  {initialLoading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {[...Array(5)].map((_, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            py: 2,
                            px: 1,
                            borderBottom: index < 4 ? '1px solid #f3f4f6' : 'none'
                          }}
                        >
                          <Box sx={{ minWidth: '60px', textAlign: 'center', mr: 2 }}>
                            <Skeleton variant="text" width={30} height={16} sx={{ mb: 0.5 }} />
                            <Skeleton variant="text" width={20} height={24} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width={80} height={20} sx={{ mb: 0.5 }} />
                            <Skeleton variant="text" width={120} height={14} />
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Skeleton variant="text" width={80} height={20} sx={{ mb: 0.5 }} />
                            <Skeleton variant="circular" width={24} height={24} />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : transactions.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 4, 
                      color: 'text.secondary' 
                    }}>
                      <Box sx={{ fontSize: '3rem', mb: 2 }}>📊</Box>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                        Start Your Investment Journey
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        Add your first transaction above to see how your investments would have grown with real S&P 500 returns.
                      </Typography>
                      <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                        💡 Try adding a deposit from a few years ago to see the power of compound growth!
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {sortedTransactions.map((transaction, index) => (
                        <Box
                          key={transaction.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            py: 2,
                            px: 1,
                            borderBottom: index < transactions.length - 1 ? '1px solid #f3f4f6' : 'none',
                            '&:hover': {
                              bgcolor: '#f9fafb'
                            },
                            bgcolor: isSelectMode && selectedTransactionIds.has(transaction.id) ? '#e3f2fd' : 'transparent'
                          }}
                        >
                          {/* Checkbox for select mode */}
                          {isSelectMode && (
                            <Box sx={{ mr: 1 }}>
                              <Checkbox
                                size="small"
                                checked={selectedTransactionIds.has(transaction.id)}
                                onChange={() => toggleTransactionSelection(transaction.id)}
                                sx={{ p: 0.5 }}
                              />
                            </Box>
                          )}
                          
                          {/* Left: Month/Day */}
                          <Box sx={{
                            minWidth: '60px',
                            textAlign: 'center',
                            mr: 2
                          }}>
                            <Typography sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: transaction.type === 'withdrawal' ? '#ef4444' : '#10b981',
                              lineHeight: 1.2
                            }}>
                              {new Date(transaction.date).toLocaleDateString('en-US', {
                                month: 'short'
                              }).toUpperCase()}
                            </Typography>
                            <Typography sx={{
                              fontSize: '1.25rem',
                              fontWeight: 700,
                              color: transaction.type === 'withdrawal' ? '#ef4444' : '#10b981',
                              lineHeight: 1
                            }}>
                              {new Date(transaction.date).getDate()}
                            </Typography>
                          </Box>
                          
                          {/* Middle: Transaction Type and Date */}
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{
                              fontSize: '1rem',
                              fontWeight: 600,
                              color: '#1f2937',
                              mb: 0.25
                            }}>
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            </Typography>
                            <Typography sx={{
                              fontSize: '0.875rem',
                              color: '#6b7280'
                            }}>
                              {new Date(transaction.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </Typography>
                          </Box>
                          
                          {/* Right: Amount and Delete Button */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{
                              fontSize: '1.125rem',
                              fontWeight: 700,
                              color: transaction.type === 'deposit' ? '#10b981' : '#ef4444'
                            }}>
                              {transaction.type === 'withdrawal' ? '-' : '+'}${transaction.amount.toLocaleString()}
                            </Typography>
                            {!isSelectMode && (
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const originalIndex = transactions.findIndex(t => t.id === transaction.id);
                                  removeTransaction(originalIndex);
                                }}
                                sx={{
                                  color: '#ef4444',
                                  '&:hover': {
                                    bgcolor: '#fee2e2'
                                  }
                                }}
                                title="Remove transaction"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                       ))}
                    </Box>
                  )}
                </Box>
              </Card>
            </Box>
          </Box>



          {/* Chart Section - Always Visible */}
          <Card sx={{ p: 3, mt: 1 }}>
            {loading ? (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Skeleton variant="text" width={200} height={48} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width={400} height={24} />
                </Box>
                <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 1 }} />
              </Box>
            ) : (
              <Box>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h3" sx={{ color: 'text.primary', mb: 1 }}>
                      Investment Growth
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Portfolio value over time with {availableIndices.find(i => i.id === primaryIndex)?.name || 'S&P 500'} returns
                    </Typography>
                  </Box>
                  {tempStats && (
                    <Box sx={{ textAlign: 'right', minWidth: '280px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, mb: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 400, background: 'linear-gradient(135deg, #1a1a1a 0%, #374151 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                          {formatCurrency(tempStats.currentValue)}
                        </Typography>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: '13px', fontWeight: 600, letterSpacing: '.01em' }}>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5, borderRadius: '8px', ...(tempStats.change >= 0 ? { background: '#bee4c9', color: '#166534' } : { background: '#ffe8e6', color: '#991b1b' }) }}>
                            {tempStats.change >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                            <span>{Math.abs(tempStats.changePercent).toFixed(2)}%</span>
                          </Box>
                          <span style={{ ...(tempStats.change >= 0 ? { color: '#166534' } : { color: '#991b1b' }) }}>{tempStats.change >= 0 ? '+' : ''}{formatCurrency(tempStats.change)}</span>
                          <span style={{ ...(tempStats.change >= 0 ? { color: '#166534' } : { color: '#991b1b' }) }}>{tempStats.period}</span>
                        </Box>
                      </Box>
                      {tempStats.timeRange && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '12px', fontWeight: 500 }}>
                            {tempStats.timeRange}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: '6px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}>
                            <Typography variant="body2" sx={{ color: '#374151', fontSize: '11px', fontWeight: 600 }}>
                              {availableIndices.find(i => i.id === primaryIndex)?.name || 'S&P 500'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#059669', fontSize: '11px', fontWeight: 700 }}>
                              {((availableIndices.find(i => i.id === primaryIndex)?.averageReturn || 0.10) * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
                <InteractiveChart 
              data={chartData}
              marketData={marketDataCache}
              selectedIndices={selectedIndices}
              primaryIndex={primaryIndex}
              onStatsUpdate={setTempStats}
            />
              </Box>
            )}
          </Card>

          {/* Footer */}
          <Box sx={{ mt: 3, pt: 4, borderTop: '1px solid', borderColor: 'grey.200' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Based on historical S&P 500 returns
                </Typography>
                {sp500Data && (
                  <Typography variant="body2" color="text.secondary">
                    Last Updated: {sp500Data.lastUpdated}
                  </Typography>
                )}
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                {calculationResult && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Period: {calculationResult?.summary?.investmentPeriod?.startDate} to {calculationResult?.summary?.investmentPeriod?.endDate}
                  </Typography>
                )}
                {sp500Data && (
                  <Typography variant="body2" color="text.secondary">
                    Updated: {new Date(sp500Data.lastUpdated).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
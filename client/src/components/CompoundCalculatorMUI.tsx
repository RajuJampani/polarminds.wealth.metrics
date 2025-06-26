import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon
} from '@mui/icons-material';
import { Transaction as SharedTransaction } from '../shared-types';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

interface SP500Data {
  averageReturn: number;
  historicalData: Array<{
    year: number;
    return: number;
    returnPercentage: string;
  }>;
  lastUpdated: string;
}

// Extended Transaction interface with id and description for client-side management
interface Transaction extends SharedTransaction {
  id: string;
  description?: string;
}

interface CompoundCalculatorProps {
  onCalculate: (data: {
    initialAmount: number;
    transactions: Transaction[];
    startDate: string;
    endDate: string;
  }) => void;
  onTransactionsChange?: (transactions: Transaction[]) => void;
  loading?: boolean;
  sp500Data?: SP500Data;
  compact?: boolean;
  transactions?: Transaction[];
}

const CompoundCalculatorMUI: React.FC<CompoundCalculatorProps> = ({
  onCalculate,
  onTransactionsChange,
  loading,
  sp500Data,
  compact = false,
  transactions: propTransactions
}) => {
  // Use transactions from props if provided, otherwise load from localStorage
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(() => {
    if (propTransactions) return [];
    try {
      const savedTransactions = localStorage.getItem('compound-calculator-transactions');
      return savedTransactions ? JSON.parse(savedTransactions) : [];
    } catch (error) {
      console.error('Error loading transactions from localStorage:', error);
      return [];
    }
  });
  
  const transactions = propTransactions || localTransactions;
  const setTransactions = propTransactions ? 
    (newTransactions: Transaction[]) => onTransactionsChange?.(newTransactions) :
    setLocalTransactions;
  const [newTransaction, setNewTransaction] = useState({
    date: dayjs(),
    amount: '',
    type: 'deposit' as 'deposit' | 'withdrawal',
    description: ''
  });

  const handleTransactionChange = (field: string, value: any) => {
    setNewTransaction(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save transactions to localStorage whenever they change (only if not using prop transactions)
  useEffect(() => {
    if (!propTransactions) {
      try {
        localStorage.setItem('compound-calculator-transactions', JSON.stringify(transactions));
      } catch (error) {
        console.error('Error saving transactions to localStorage:', error);
      }
    }
  }, [transactions, propTransactions]);

  // Auto-calculate when transactions change with debounce (only for local transactions, not prop transactions)
  useEffect(() => {
    // Skip auto-calculation if using prop transactions - let parent handle it
    if (propTransactions) return;
    
    const timeoutId = setTimeout(() => {
      if (transactions.length === 0) {
        // Clear calculation results when no transactions
        onCalculate({
          initialAmount: 0,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          transactions: []
        });
        return;
      }
      
      const endDate = new Date().toISOString().split('T')[0];
      const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const startDate = sortedTransactions[0].date;
      
      onCalculate({
        initialAmount: 0,
        startDate,
        endDate,
        transactions
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [transactions, onCalculate, propTransactions]);

  // Notify parent component when transactions change
  useEffect(() => {
    if (onTransactionsChange) {
      onTransactionsChange(transactions);
    }
  }, [transactions, onTransactionsChange]);

  const addTransaction = () => {
    const amount = parseFloat(newTransaction.amount);
    if (amount > 0 && newTransaction.date) {
      const transaction: Transaction = {
        id: Date.now().toString(),
        date: newTransaction.date.format('YYYY-MM-DD'),
        amount: amount,
        type: newTransaction.type,
        description: newTransaction.description || `${newTransaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${formatCurrency(amount)}`
      };
      
      const updatedTransactions = [...transactions, transaction].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setTransactions(updatedTransactions);
      setNewTransaction({
        date: dayjs(),
        amount: '',
        type: 'deposit',
        description: ''
      });
    }
  };



  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getInvestmentPeriod = () => {
    if (transactions.length === 0) return null;
    const sortedTransactions = transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const startDate = new Date(sortedTransactions[0].date);
    const endDate = new Date();
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    const years = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;
    return { years, months: remainingMonths, totalMonths: diffMonths };
  };

  const getNetInvestment = () => {
    return transactions.reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount : -t.amount), 0);
  };

  const period = getInvestmentPeriod();

  if (compact) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box>
          {/* Header */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h3" sx={{ color: 'text.primary', mb: 1 }}>
              Add Transactions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track your investment deposits and withdrawals over time
            </Typography>
          </Box>

          {/* Compact Transaction Input Form */}
          <Box sx={{ 
            p: { xs: 1.5, sm: 2 }, 
            bgcolor: 'grey.50', 
            borderRadius: 2, 
            mb: 2 
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1.5, sm: 2 }, 
              alignItems: { xs: 'stretch', sm: 'end' } 
            }}>
              <Box sx={{ flex: { sm: '1 1 auto' }, minWidth: { xs: 'auto', sm: '120px' } }}>
                  <DatePicker
                    label="Date"
                    value={newTransaction.date}
                    onChange={(newValue) => handleTransactionChange('date', newValue)}
                    maxDate={dayjs()}
                    minDate={dayjs('1990-01-01')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small'
                      }
                    }}
                  />
                </Box>
              <Box sx={{ flex: { sm: '0 0 auto' }, minWidth: { xs: 'auto', sm: '100px' } }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={newTransaction.type}
                      label="Type"
                      onChange={(e) => handleTransactionChange('type', e.target.value)}
                    >
                      <MenuItem value="deposit">Deposit</MenuItem>
                      <MenuItem value="withdrawal">Withdrawal</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              <Box sx={{ flex: { sm: '1 1 auto' }, minWidth: { xs: 'auto', sm: '120px' } }}>
                  <TextField
                    label="Amount"
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) => handleTransactionChange('amount', e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    inputProps={{ min: 0, step: 100 }}
                  />
                </Box>
              <Box sx={{ flex: { sm: '0 0 auto' } }}>
                  <Button
                    variant="contained"
                    onClick={addTransaction}
                    disabled={!newTransaction.amount || parseFloat(newTransaction.amount) <= 0 || loading}
                    startIcon={<AddIcon />}
                    fullWidth
                    size="small"
                    sx={{ height: 40, minWidth: { xs: 'auto', sm: '140px' } }}
                  >
                    Add
                  </Button>
                </Box>
            </Box>
          </Box>
        </Box>
      </LocalizationProvider>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ mb: 4 }}>
        <Card sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h3" sx={{ color: 'text.primary', mb: 1 }}>
              Add Transactions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track your investment deposits and withdrawals over time
            </Typography>
          </Box>

          {/* Transaction Input Form */}
          <Box sx={{ 
            p: { xs: 2, sm: 3 }, 
            bgcolor: 'grey.50', 
            borderRadius: 2, 
            mb: 3 
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: { xs: 1.5, sm: 2 }, 
              alignItems: 'end' 
            }}>
              <Box sx={{ flex: '1 1 200px', minWidth: { xs: '150px', sm: '200px' } }}>
                  <DatePicker
                    label="Date"
                    value={newTransaction.date}
                    onChange={(newValue) => handleTransactionChange('date', newValue)}
                    maxDate={dayjs()}
                    minDate={dayjs('1990-01-01')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small'
                      }
                    }}
                  />
                </Box>
              <Box sx={{ flex: '1 1 150px', minWidth: { xs: '120px', sm: '150px' } }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={newTransaction.type}
                      label="Type"
                      onChange={(e) => handleTransactionChange('type', e.target.value)}
                    >
                      <MenuItem value="deposit">Deposit</MenuItem>
                      <MenuItem value="withdrawal">Withdrawal</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: { xs: '150px', sm: '200px' } }}>
                  <TextField
                    label="Amount"
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) => handleTransactionChange('amount', e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    inputProps={{ min: 0, step: 100 }}
                  />
                </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: { xs: '150px', sm: '200px' } }}>
                  <Button
                    variant="contained"
                    onClick={addTransaction}
                    disabled={!newTransaction.amount || parseFloat(newTransaction.amount) <= 0 || loading}
                    startIcon={<AddIcon />}
                    fullWidth
                    sx={{ height: 40 }}
                  >
                    Add Transaction
                  </Button>
                </Box>
            </Box>
          </Box>

            {/* Investment Overview - Always visible */}
            <Box sx={{ 
              p: { xs: 2, sm: 3 }, 
              bgcolor: 'background.paper', 
              borderRadius: 2, 
              mb: 3, 
              border: '1px solid', 
              borderColor: 'grey.200',
              marginBottom: 0 
            }}>
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 600, 
                mb: 2,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}>
                Investment Overview
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: 'repeat(auto-fit, minmax(150px, 1fr))' 
                }, 
                gap: { xs: 2, sm: 3 } 
              }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 0.5,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>Investment Period</Typography>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    {period ? `${period.years}y ${period.months}m` : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 0.5,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>Total Transactions</Typography>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    {transactions.length}
                  </Typography>
                </Box>
                <Box>  
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 0.5,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>Net Investment</Typography>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    color: getNetInvestment() >= 0 ? 'success.main' : 'error.main',
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    {formatCurrency(getNetInvestment())}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default CompoundCalculatorMUI;
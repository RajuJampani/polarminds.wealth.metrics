import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import {
  MarketIndices,
  CalculationRequest,
  CalculationResult,
  Transaction,
  MarketDataResponse,
  MarketIndexInfo,
  HistoricalReturns,
  AllHistoricalReturns,
  MonthlyDataPoint,
  YearlyDataPoint
} from './shared-types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Cache for 1 hour (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600 });

app.use(cors());
app.use(express.json());

// Market indices historical average returns
const MARKET_INDICES: MarketIndices = {
  sp500: {
    name: 'S&P 500',
    averageReturn: 0.10,
    historicalData: [
      { year: 2020, return: 0.184, returnPercentage: '18.4%', index: 'sp500', indexName: 'S&P 500' },
      { year: 2021, return: 0.269, returnPercentage: '26.9%', index: 'sp500', indexName: 'S&P 500' },
      { year: 2022, return: -0.196, returnPercentage: '-19.6%', index: 'sp500', indexName: 'S&P 500' },
      { year: 2023, return: 0.243, returnPercentage: '24.3%', index: 'sp500', indexName: 'S&P 500' },
      { year: 2024, return: 0.115, returnPercentage: '11.5%', index: 'sp500', indexName: 'S&P 500' }
    ]
  },
  nasdaq: {
    name: 'NASDAQ',
    averageReturn: 0.115,
    historicalData: [
      { year: 2020, return: 0.435, returnPercentage: '43.5%', index: 'nasdaq', indexName: 'NASDAQ' },
      { year: 2021, return: 0.214, returnPercentage: '21.4%', index: 'nasdaq', indexName: 'NASDAQ' },
      { year: 2022, return: -0.331, returnPercentage: '-33.1%', index: 'nasdaq', indexName: 'NASDAQ' },
      { year: 2023, return: 0.435, returnPercentage: '43.5%', index: 'nasdaq', indexName: 'NASDAQ' },
      { year: 2024, return: 0.125, returnPercentage: '12.5%', index: 'nasdaq', indexName: 'NASDAQ' }
    ]
  },
  dow: {
    name: 'Dow Jones',
    averageReturn: 0.095,
    historicalData: [
      { year: 2020, return: 0.074, returnPercentage: '7.4%', index: 'dow', indexName: 'Dow Jones' },
      { year: 2021, return: 0.187, returnPercentage: '18.7%', index: 'dow', indexName: 'Dow Jones' },
      { year: 2022, return: -0.086, returnPercentage: '-8.6%', index: 'dow', indexName: 'Dow Jones' },
      { year: 2023, return: 0.138, returnPercentage: '13.8%', index: 'dow', indexName: 'Dow Jones' },
      { year: 2024, return: 0.095, returnPercentage: '9.5%', index: 'dow', indexName: 'Dow Jones' }
    ]
  },
  russell2000: {
    name: 'Russell 2000',
    averageReturn: 0.092,
    historicalData: [
      { year: 2020, return: 0.198, returnPercentage: '19.8%', index: 'russell2000', indexName: 'Russell 2000' },
      { year: 2021, return: 0.146, returnPercentage: '14.6%', index: 'russell2000', indexName: 'Russell 2000' },
      { year: 2022, return: -0.212, returnPercentage: '-21.2%', index: 'russell2000', indexName: 'Russell 2000' },
      { year: 2023, return: 0.169, returnPercentage: '16.9%', index: 'russell2000', indexName: 'Russell 2000' },
      { year: 2024, return: 0.085, returnPercentage: '8.5%', index: 'russell2000', indexName: 'Russell 2000' }
    ]
  },
  ftse100: {
    name: 'FTSE 100',
    averageReturn: 0.075,
    historicalData: [
      { year: 2020, return: -0.143, returnPercentage: '-14.3%', index: 'ftse100', indexName: 'FTSE 100' },
      { year: 2021, return: 0.142, returnPercentage: '14.2%', index: 'ftse100', indexName: 'FTSE 100' },
      { year: 2022, return: 0.005, returnPercentage: '0.5%', index: 'ftse100', indexName: 'FTSE 100' },
      { year: 2023, return: 0.038, returnPercentage: '3.8%', index: 'ftse100', indexName: 'FTSE 100' },
      { year: 2024, return: 0.075, returnPercentage: '7.5%', index: 'ftse100', indexName: 'FTSE 100' }
    ]
  },
  nikkei225: {
    name: 'Nikkei 225',
    averageReturn: 0.085,
    historicalData: [
      { year: 2020, return: 0.161, returnPercentage: '16.1%', index: 'nikkei225', indexName: 'Nikkei 225' },
      { year: 2021, return: 0.045, returnPercentage: '4.5%', index: 'nikkei225', indexName: 'Nikkei 225' },
      { year: 2022, return: -0.094, returnPercentage: '-9.4%', index: 'nikkei225', indexName: 'Nikkei 225' },
      { year: 2023, return: 0.284, returnPercentage: '28.4%', index: 'nikkei225', indexName: 'Nikkei 225' },
      { year: 2024, return: 0.095, returnPercentage: '9.5%', index: 'nikkei225', indexName: 'Nikkei 225' }
    ]
  }
};

// Get market index data
app.get('/api/market-data/:index?', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const index = req.params.index || 'sp500';
    
    if (!MARKET_INDICES[index]) {
      res.status(400).json({ error: 'Invalid market index' });
      return;
    }
    
    const cacheKey = `${index}-data-${startDate}-${endDate}`;
    const cachedData = cache.get<MarketDataResponse>(cacheKey);
    
    if (cachedData) {
      res.json(cachedData);
      return;
    }

    // Generate realistic market data based on historical trends
    const historicalData = generateRealisticMarketData(index, startDate as string, endDate as string);
    
    cache.set(cacheKey, historicalData);
    res.json(historicalData);
  } catch (error) {
    console.error(`Error fetching ${req.params.index || 'market'} data:`, error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Legacy S&P 500 endpoint for backward compatibility
app.get('/api/sp500-data', async (req: Request, res: Response): Promise<void> => {
  try {
    const index = 'sp500';
    const marketData = MARKET_INDICES[index];
    
    if (!marketData) {
      res.status(404).json({ error: 'Market index not found' });
      return;
    }

    res.json({
       index,
       indexName: marketData.name,
       averageReturn: marketData.averageReturn,
       historicalData: marketData.historicalData,
       lastUpdated: new Date().toISOString()
     });
   } catch (error) {
     console.error('Error fetching S&P 500 data:', error);
     res.status(500).json({ error: 'Failed to fetch S&P 500 data' });
   }
 });

// Get available market indices
app.get('/api/market-indices', (req: Request, res: Response): void => {
  try {
    const indices: MarketIndexInfo[] = Object.keys(MARKET_INDICES).map(key => ({
      id: key,
      name: MARKET_INDICES[key].name,
      averageReturn: MARKET_INDICES[key].averageReturn
    }));
    res.json(indices);
  } catch (error) {
    console.error('Error fetching market indices:', error);
    res.status(500).json({ error: 'Failed to fetch market indices' });
  }
});

// Calculate compound interest with market index returns using real dates
app.post('/api/calculate-compound', (req: Request, res: Response): void => {
  try {
    const { 
      initialAmount, 
      principal, // Support both parameter names
      transactions = [], 
      startDate, 
      endDate,
      useHistoricalData = true,
      marketIndex 
    } = req.body;

    // Use either initialAmount or principal
    const startingAmount = initialAmount !== undefined ? initialAmount : principal;

    // Validate that we have either an initial amount or transactions
    if ((startingAmount === undefined || startingAmount === null) && (!transactions || transactions.length === 0)) {
      res.status(400).json({ error: 'Either initial amount or transactions are required' });
      return;
    }
    
    if (!startDate) {
      res.status(400).json({ error: 'Start date is required' });
      return;
    }

    const index = marketIndex || 'sp500';
    if (!MARKET_INDICES[index]) {
      res.status(400).json({ error: 'Invalid market index' });
      return;
    }

    // Validate transactions
    const validTransactions: Transaction[] = transactions.filter((t: any) => 
      t && t.date && t.amount && t.type && 
      (t.type === 'deposit' || t.type === 'withdrawal') &&
      !isNaN(parseFloat(t.amount.toString()))
    ).map((t: any) => ({
      ...t,
      amount: parseFloat(t.amount.toString())
    }));

    const result = calculateCompoundInterestWithDates(
      parseFloat(startingAmount?.toString() || '0'),
      validTransactions,
      startDate,
      endDate || new Date().toISOString().split('T')[0],
      useHistoricalData,
      index
    );

    res.json(result);
  } catch (error) {
    console.error('Error calculating compound interest:', error);
    res.status(500).json({ error: 'Calculation failed' });
  }
});

function generateRealisticMarketData(index: string, startDate?: string, endDate?: string): MarketDataResponse {
  const start = new Date(startDate || '1990-01-01');
  const end = new Date(endDate || new Date());
  const data = [];
  
  // Historical returns for different market indices
  const historicalReturns: AllHistoricalReturns = {
    sp500: {
      1990: 0.0310, 1991: 0.3047, 1992: 0.0762, 1993: 0.1008, 1994: 0.0132,
      1995: 0.3758, 1996: 0.2296, 1997: 0.3336, 1998: 0.2858, 1999: 0.2104,
      2000: -0.0910, 2001: -0.1189, 2002: -0.2210, 2003: 0.2868, 2004: 0.1088,
      2005: 0.0491, 2006: 0.1579, 2007: 0.0549, 2008: -0.3700, 2009: 0.2646,
      2010: 0.1506, 2011: 0.0211, 2012: 0.1600, 2013: 0.3239, 2014: 0.1369,
      2015: 0.0138, 2016: 0.1196, 2017: 0.2183, 2018: -0.0438, 2019: 0.3157,
      2020: 0.1640, 2021: 0.2689, 2022: -0.1954, 2023: 0.2411, 2024: 0.12
    },
    dow: {
      1990: 0.0404, 1991: 0.2014, 1992: 0.0421, 1993: 0.1372, 1994: 0.0213,
      1995: 0.3336, 1996: 0.2615, 1997: 0.2275, 1998: 0.1611, 1999: 0.2725,
      2000: -0.0618, 2001: -0.0715, 2002: -0.1693, 2003: 0.2514, 2004: 0.0317,
      2005: -0.0061, 2006: 0.1606, 2007: 0.0626, 2008: -0.3394, 2009: 0.1876,
      2010: 0.1102, 2011: 0.0554, 2012: 0.0726, 2013: 0.2654, 2014: 0.0751,
      2015: -0.0234, 2016: 0.1342, 2017: 0.2517, 2018: -0.0587, 2019: 0.2234,
      2020: 0.0725, 2021: 0.1885, 2022: -0.0856, 2023: 0.1397, 2024: 0.095
    },
    nasdaq: {
      1990: -0.1746, 1991: 0.5648, 1992: 0.1561, 1993: 0.1456, 1994: -0.0318,
      1995: 0.3963, 1996: 0.2267, 1997: 0.2144, 1998: 0.3969, 1999: 0.8550,
      2000: -0.3910, 2001: -0.2102, 2002: -0.3155, 2003: 0.5015, 2004: 0.0885,
      2005: 0.0135, 2006: 0.0956, 2007: 0.0975, 2008: -0.4018, 2009: 0.4338,
      2010: 0.1694, 2011: -0.0180, 2012: 0.1574, 2013: 0.3848, 2014: 0.1351,
      2015: 0.0559, 2016: 0.0739, 2017: 0.2836, 2018: -0.0356, 2019: 0.3556,
      2020: 0.4391, 2021: 0.2103, 2022: -0.3256, 2023: 0.4381, 2024: 0.115
    },
    russell2000: {
      1990: -0.1949, 1991: 0.4621, 1992: 0.1835, 1993: 0.2109, 1994: -0.0185,
      1995: 0.2875, 1996: 0.1643, 1997: 0.2236, 1998: -0.0251, 1999: 0.2123,
      2000: -0.0303, 2001: 0.0249, 2002: -0.2044, 2003: 0.4741, 2004: 0.1825,
      2005: 0.0484, 2006: 0.1837, 2007: -0.0157, 2008: -0.3349, 2009: 0.2746,
      2010: 0.2688, 2011: -0.0412, 2012: 0.1609, 2013: 0.3870, 2014: 0.0489,
      2015: -0.0441, 2016: 0.2123, 2017: 0.1449, 2018: -0.1151, 2019: 0.2517,
      2020: 0.1994, 2021: 0.1462, 2022: -0.2044, 2023: 0.1665, 2024: 0.092
    },
    ftse100: {
      1990: -0.0935, 1991: 0.1634, 1992: 0.1985, 1993: 0.2834, 1994: -0.0954,
      1995: 0.2034, 1996: 0.1185, 1997: 0.2485, 1998: 0.1434, 1999: 0.1785,
      2000: -0.1034, 2001: -0.1385, 2002: -0.2485, 2003: 0.1385, 2004: 0.0785,
      2005: 0.1634, 2006: 0.1034, 2007: 0.0385, 2008: -0.3134, 2009: 0.2234,
      2010: 0.0934, 2011: -0.0585, 2012: 0.0585, 2013: 0.1434, 2014: -0.0234,
      2015: -0.0485, 2016: 0.1434, 2017: 0.0734, 2018: -0.1234, 2019: 0.1234,
      2020: -0.1434, 2021: 0.1434, 2022: 0.0034, 2023: 0.0384, 2024: 0.075
    },
    nikkei225: {
      1990: -0.3834, 1991: 0.0434, 1992: -0.2634, 1993: 0.0334, 1994: 0.1334,
      1995: -0.0134, 1996: -0.0334, 1997: -0.2134, 1998: -0.0934, 1999: 0.3634,
      2000: -0.2734, 2001: -0.2334, 2002: -0.1834, 2003: 0.2434, 2004: 0.0734,
      2005: 0.4034, 2006: 0.0634, 2007: -0.1134, 2008: -0.4234, 2009: 0.1934,
      2010: -0.0334, 2011: -0.1734, 2012: 0.2284, 2013: 0.5684, 2014: -0.0834,
      2015: 0.0934, 2016: -0.0234, 2017: 0.1934, 2018: -0.1234, 2019: 0.1834,
      2020: 0.1634, 2021: 0.0434, 2022: -0.0934, 2023: 0.2834, 2024: 0.095
    }
  };
  
  const indexReturns = historicalReturns[index];
  const defaultReturn = MARKET_INDICES[index].averageReturn;
  
  let currentYear = start.getFullYear();
  const endYear = end.getFullYear();
  
  while (currentYear <= endYear) {
    const annualReturn = indexReturns[currentYear] || defaultReturn;
    
    data.push({
      year: currentYear,
      return: annualReturn,
      returnPercentage: (annualReturn * 100).toFixed(2),
      date: `${currentYear}-12-31`,
      index: index,
      indexName: MARKET_INDICES[index].name
    });
    
    currentYear++;
  }
  
  const averageReturn = data.reduce((sum, item) => sum + item.return, 0) / data.length;
  
  return {
    index,
    indexName: MARKET_INDICES[index].name,
    averageReturn,
    historicalData: data,
    lastUpdated: new Date().toISOString(),
    period: {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }
  };
}

function calculateCompoundInterestWithDates(
  principal: number, 
  transactions: Transaction[], 
  startDate: string, 
  endDate: string, 
  useHistoricalData: boolean, 
  marketIndex: string = 'sp500'
): CalculationResult {
  // Parse dates properly to avoid timezone issues
  const start = new Date(startDate);
  start.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
  const end = new Date(endDate);
  end.setHours(12, 0, 0, 0);
  const monthlyData: MonthlyDataPoint[] = [];
  const yearlyData: YearlyDataPoint[] = [];
  
  // Get historical returns for the specified market index
  const allHistoricalReturns: AllHistoricalReturns = {
    sp500: {
      1990: 0.0310, 1991: 0.3047, 1992: 0.0762, 1993: 0.1008, 1994: 0.0132,
      1995: 0.3758, 1996: 0.2296, 1997: 0.3336, 1998: 0.2858, 1999: 0.2104,
      2000: -0.0910, 2001: -0.1189, 2002: -0.2210, 2003: 0.2868, 2004: 0.1088,
      2005: 0.0491, 2006: 0.1579, 2007: 0.0549, 2008: -0.3700, 2009: 0.2646,
      2010: 0.1506, 2011: 0.0211, 2012: 0.1600, 2013: 0.3239, 2014: 0.1369,
      2015: 0.0138, 2016: 0.1196, 2017: 0.2183, 2018: -0.0438, 2019: 0.3157,
      2020: 0.1640, 2021: 0.2689, 2022: -0.1954, 2023: 0.2411, 2024: 0.12
    },
    dowjones: {
      1990: 0.0404, 1991: 0.2014, 1992: 0.0421, 1993: 0.1372, 1994: 0.0213,
      1995: 0.3336, 1996: 0.2615, 1997: 0.2275, 1998: 0.1611, 1999: 0.2725,
      2000: -0.0618, 2001: -0.0715, 2002: -0.1693, 2003: 0.2514, 2004: 0.0317,
      2005: -0.0061, 2006: 0.1606, 2007: 0.0626, 2008: -0.3394, 2009: 0.1876,
      2010: 0.1102, 2011: 0.0554, 2012: 0.0726, 2013: 0.2654, 2014: 0.0751,
      2015: -0.0234, 2016: 0.1342, 2017: 0.2517, 2018: -0.0587, 2019: 0.2234,
      2020: 0.0725, 2021: 0.1885, 2022: -0.0856, 2023: 0.1397, 2024: 0.095
    },
    nasdaq: {
      1990: -0.1746, 1991: 0.5648, 1992: 0.1561, 1993: 0.1456, 1994: -0.0318,
      1995: 0.3963, 1996: 0.2267, 1997: 0.2144, 1998: 0.3969, 1999: 0.8550,
      2000: -0.3910, 2001: -0.2102, 2002: -0.3155, 2003: 0.5015, 2004: 0.0885,
      2005: 0.0135, 2006: 0.0956, 2007: 0.0975, 2008: -0.4018, 2009: 0.4338,
      2010: 0.1694, 2011: -0.0180, 2012: 0.1574, 2013: 0.3848, 2014: 0.1351,
      2015: 0.0559, 2016: 0.0739, 2017: 0.2836, 2018: -0.0356, 2019: 0.3556,
      2020: 0.4391, 2021: 0.2103, 2022: -0.3256, 2023: 0.4381, 2024: 0.115
    },
    russell2000: {
      1990: -0.1949, 1991: 0.4621, 1992: 0.1835, 1993: 0.2109, 1994: -0.0185,
      1995: 0.2875, 1996: 0.1643, 1997: 0.2236, 1998: -0.0251, 1999: 0.2123,
      2000: -0.0303, 2001: 0.0249, 2002: -0.2044, 2003: 0.4741, 2004: 0.1825,
      2005: 0.0484, 2006: 0.1837, 2007: -0.0157, 2008: -0.3349, 2009: 0.2746,
      2010: 0.2688, 2011: -0.0412, 2012: 0.1609, 2013: 0.3870, 2014: 0.0489,
      2015: -0.0441, 2016: 0.2123, 2017: 0.1449, 2018: -0.1151, 2019: 0.2517,
      2020: 0.1994, 2021: 0.1462, 2022: -0.2044, 2023: 0.1665, 2024: 0.092
    }
  };
  
  const historicalReturns = allHistoricalReturns[marketIndex] || allHistoricalReturns.sp500;
  const defaultReturn = MARKET_INDICES[marketIndex]?.averageReturn || MARKET_INDICES.sp500.averageReturn;
  
  // Sort transactions by date
  const sortedTransactions = transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let currentAmount = principal;
  let currentYear = start.getFullYear();
  let currentMonth = start.getMonth(); // 0-11
  
  // Adjust for the fact that we want to start from the actual start month
  // The loop processes the current month, so we don't need to adjust
  let totalMonths = 0;
  let totalContributions = principal;
  let totalDeposits = principal;
  let totalWithdrawals = 0;
  let transactionIndex = 0;
  
  while (currentYear < end.getFullYear() || (currentYear === end.getFullYear() && currentMonth <= end.getMonth())) {
    const annualReturn = historicalReturns[currentYear] || defaultReturn;
    const monthlyReturn = annualReturn / 12;
    
    // Create current date for this iteration
    const currentDate = new Date(currentYear, currentMonth, 1);
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const currentYearNum = currentYear;
    const currentMonthNum = currentMonth;
    
    while (transactionIndex < sortedTransactions.length) {
      const transaction = sortedTransactions[transactionIndex];
      const transactionDate = new Date(transaction.date);
      
      // Check if transaction is in current month
      if (transactionDate.getFullYear() === currentYearNum && 
          transactionDate.getMonth() === currentMonthNum) {
        
        if (transaction.type === 'deposit') {
          currentAmount += transaction.amount;
          totalContributions += transaction.amount;
          totalDeposits += transaction.amount;
        } else if (transaction.type === 'withdrawal') {
          // Prevent withdrawals from exceeding current portfolio value
          const withdrawalAmount = Math.min(transaction.amount, Math.max(0, currentAmount));
          currentAmount -= withdrawalAmount;
          totalWithdrawals += withdrawalAmount;
          // Don't subtract from totalContributions - it should only track total deposits
        }
        transactionIndex++;
      } else if (transactionDate > currentDate) {
        break;
      } else {
        transactionIndex++;
      }
    }
    
    // Apply monthly return (compound monthly)
    currentAmount *= (1 + monthlyReturn);
    
    totalMonths++;
    
    const currentGains = currentAmount - totalContributions;
    const currentNetInvestment = totalDeposits - totalWithdrawals;
    
    monthlyData.push({
      month: totalMonths,
      year: currentYear,
      monthOfYear: currentMonth + 1, // 1-12
      date: currentDateStr,
      amount: Math.round(currentAmount * 100) / 100,
      contributions: Math.round(totalContributions * 100) / 100,
      netInvestment: Math.round(currentNetInvestment * 100) / 100,
      gains: Math.round(currentGains * 100) / 100,
      annualReturn: (annualReturn * 100).toFixed(2)
    });
    
    // If it's December, add yearly data
    if (currentMonth === 11) {
      const totalGains = currentAmount - totalContributions;
      const roi = totalContributions > 0 ? ((totalGains / totalContributions) * 100) : 0;
      const yearlyNetInvestment = totalDeposits - totalWithdrawals;
      
      yearlyData.push({
        year: currentYear,
        date: currentDateStr,
        amount: Math.round(currentAmount * 100) / 100,
        contributions: Math.round(totalContributions * 100) / 100,
        netInvestment: Math.round(yearlyNetInvestment * 100) / 100,
        gains: Math.round(totalGains * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        annualReturn: (annualReturn * 100).toFixed(2)
      });
    }
    
    // Move to next month
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }
  
  const finalAmount = currentAmount;
  
  // Calculate gross activity metrics
  // totalDeposits is already calculated in the loop above
  
  // totalWithdrawals is already calculated in the loop above
  
  const netInvestment = totalDeposits - totalWithdrawals;
  
  // Calculate gains based on different perspectives
  const totalGains = finalAmount - totalContributions; // Gains vs actual contributions
  const netGains = finalAmount - netInvestment; // Gains vs net investment
  
  const totalROI = totalContributions > 0 ? ((totalGains / totalContributions) * 100) : 0;
  const netROI = netInvestment !== 0 ? ((netGains / Math.abs(netInvestment)) * 100) : 0;
  
  // Calculate average return for the period
  const years = Object.keys(historicalReturns).filter(year => 
    parseInt(year) >= start.getFullYear() && parseInt(year) <= end.getFullYear()
  );
  const avgReturn = years.reduce((sum, year) => 
    sum + (historicalReturns[parseInt(year)] || defaultReturn), 0
  ) / years.length;
  
  return {
    summary: {
      finalAmount: Math.round(finalAmount * 100) / 100,
      totalContributions: Math.round(totalContributions * 100) / 100,
      totalGains: Math.round(totalGains * 100) / 100,
      totalROI: Math.round(totalROI * 100) / 100,
      // New gross activity metrics
      totalDeposits: Math.round(totalDeposits * 100) / 100,
      totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,
      netInvestment: Math.round(netInvestment * 100) / 100,
      netGains: Math.round(netGains * 100) / 100,
      netROI: Math.round(netROI * 100) / 100,
      averageAnnualReturn: (avgReturn * 100).toFixed(2),
      investmentPeriod: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        totalMonths
      }
    },
    monthlyData,
    yearlyData
  };
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
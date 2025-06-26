import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { CalculationResult, MarketDataResponse as MarketData } from '../shared-types';
import './InteractiveChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Types are now imported from shared-types.ts

interface InteractiveChartProps {
  data: CalculationResult;
  marketData?: Record<string, MarketData>;
  selectedIndices?: string[];
  primaryIndex?: string;
  onStatsUpdate?: (stats: any) => void;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({ 
  data, 
  marketData = {}, 
  selectedIndices = ['sp500'], 
  primaryIndex = 'sp500',
  onStatsUpdate
}) => {

  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('yearly');
  const [showProjection, setShowProjection] = useState(false);
  const [projectionYears] = useState(5);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('MAX');
  const [autoProjectionEnabled, setAutoProjectionEnabled] = useState(false);
  const chartRef = useRef<ChartJS<'line'> | null>(null);

  // Memoize formatCurrency to prevent unnecessary re-creation
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  // Memoize getAvailablePeriods to prevent unnecessary re-creation
  const getAvailablePeriods = useCallback(() => {
    const baseData = viewMode === 'yearly' ? data.yearlyData : data.monthlyData;
    
    if (baseData.length === 0) return ['MAX'];
    
    if (viewMode === 'yearly') {
      return ['1Y', '2Y', '5Y', '10Y', '20Y', 'MAX'];
    } else {
      return ['6M', 'YTD', '1Y', '2Y', '5Y', '10Y', '20Y', 'MAX'];
    }
  }, [viewMode, data.yearlyData, data.monthlyData]);

  // Memoize filterDataByPeriod to prevent unnecessary re-creation
  const filterDataByPeriod = useCallback((baseData: any[]) => {
    if (baseData.length === 0) {
      return baseData;
    }
    
    // For MAX period, include 1 year prior to investment start if market data is available
    if (selectedPeriod === 'MAX') {
      // Get the investment start date from the first data point
      const investmentStartDate = baseData[0];
      if (!investmentStartDate) return baseData;
      
      // Calculate 1 year prior to investment start
      const startYear = investmentStartDate.year || new Date().getFullYear();
      const oneYearPrior = startYear - 1;
      
      return baseData;
    }

    if (viewMode === 'yearly') {
       // Special logic for yearly view periods
       let expectedYearlyDataPoints = 0;
       let filteredData = baseData;
       
       switch (selectedPeriod) {
        case '1Y':
          expectedYearlyDataPoints = 2;
          filteredData = baseData.slice(-2);
          break;
        case '2Y':
          expectedYearlyDataPoints = 3;
          filteredData = baseData.slice(-3);
          break;
        case '5Y':
          expectedYearlyDataPoints = 6;
          filteredData = baseData.slice(-Math.min(6, baseData.length));
          break;
        case '10Y':
          expectedYearlyDataPoints = 11;
          filteredData = baseData;
          break;
        case '20Y':
          expectedYearlyDataPoints = 21;
          filteredData = baseData;
          break;
        default:
          return baseData;
      }
      
      // Only enable projection if we have insufficient historical data for yearly view
       if (filteredData.length < expectedYearlyDataPoints) {
         setAutoProjectionEnabled(true);
         setShowProjection(true);
       }
      
      return filteredData;
    } else {
      // Original logic for monthly view
      const now = new Date();
      let cutoffDate: Date;

      switch (selectedPeriod) {
        case '6M':
          cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case 'YTD':
          cutoffDate = new Date(now.getFullYear(), 0, 1);
          break;
        case '1Y':
          cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        case '2Y':
          cutoffDate = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
          break;
        case '5Y':
          cutoffDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
          break;
        case '10Y':
          cutoffDate = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
          break;
        case '20Y':
          cutoffDate = new Date(now.getFullYear() - 20, now.getMonth(), now.getDate());
          break;
        default:
          return baseData;
      }

      const filteredData = baseData.filter((item) => {
         // Use the actual year and month from the data
         const itemDate = new Date(item.year || new Date().getFullYear(), (item.monthOfYear || item.month) - 1, 1);
         return itemDate >= cutoffDate;
       });

      // Auto-enable projection for monthly view only when there's insufficient historical data
      // Calculate expected data points for the selected period
      let expectedDataPoints = 0;
      switch (selectedPeriod) {
        case '6M':
          expectedDataPoints = 6;
          break;
        case 'YTD':
          expectedDataPoints = new Date().getMonth() + 1; // Current month number
          break;
        case '1Y':
          expectedDataPoints = 12;
          break;
        case '2Y':
          expectedDataPoints = 24;
          break;
        case '5Y':
          expectedDataPoints = 60;
          break;
        case '10Y':
          expectedDataPoints = 120;
          break;
        case '20Y':
          expectedDataPoints = 240;
          break;
        default:
          expectedDataPoints = filteredData.length;
      }
      
      // Only enable projection if we have insufficient historical data
       if (filteredData.length < expectedDataPoints) {
         setAutoProjectionEnabled(true);
         setShowProjection(true);
       }

      return filteredData;
    }
  }, [selectedPeriod, viewMode]);

  // Reset period when switching view modes and handle auto projection
  useEffect(() => {
    const availablePeriods = getAvailablePeriods();
    if (availablePeriods.indexOf(selectedPeriod) === -1) {
      setSelectedPeriod('MAX');
    }
    
    // Reset auto projection - will be handled in filterDataByPeriod based on data sufficiency
    setAutoProjectionEnabled(false);
    setShowProjection(false);
  }, [viewMode, selectedPeriod, getAvailablePeriods, data.monthlyData, filterDataByPeriod]);

  // Memoize generateProjectionData to prevent unnecessary re-creation
  const generateProjectionData = useCallback(() => {
    if (!showProjection || !data.yearlyData.length) return { labels: [], amounts: [], contributions: [] };

    const lastYear = data.yearlyData[data.yearlyData.length - 1];
     // Use consistent market data - fallback to S&P 500's return if primary index not found
     const selectedMarketReturn = marketData[primaryIndex]?.averageReturn || marketData['sp500']?.averageReturn || 0.10;
     const monthlyReturn = selectedMarketReturn / 12;
     const monthlyContribution = ((lastYear.netInvestment || lastYear.contributions) - (data.summary.netInvestment || data.summary.totalContributions)) / (lastYear.year * 12) || 0;

    const labels: string[] = [];
    const amounts: number[] = [];
    const contributions: number[] = [];

    let currentValue = lastYear.amount;
     let totalContributions = lastYear.netInvestment || lastYear.contributions;

    // Calculate projection years/months based on selected period to only fill missing time
    let actualProjectionYears = projectionYears;
    let projectionMonths = actualProjectionYears * 12;
    
    if (autoProjectionEnabled) {
      if (viewMode === 'yearly') {
        const historicalYears = data.yearlyData.length;
        if (selectedPeriod === '1Y') {
          actualProjectionYears = Math.max(0, 1 - historicalYears);
        } else if (selectedPeriod === '2Y') {
          actualProjectionYears = Math.max(0, 2 - historicalYears);
        } else if (selectedPeriod === '5Y') {
          actualProjectionYears = Math.max(0, 5 - historicalYears);
        } else if (selectedPeriod === '10Y') {
          actualProjectionYears = Math.max(0, 10 - historicalYears);
        } else if (selectedPeriod === '20Y') {
          actualProjectionYears = Math.max(0, 20 - historicalYears);
        }
        projectionMonths = actualProjectionYears * 12;
      } else {
        // Monthly view - calculate missing months for the selected period
        const historicalMonths = data.monthlyData.length;
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        
        if (selectedPeriod === '6M') {
          projectionMonths = Math.max(0, 6 - historicalMonths);
        } else if (selectedPeriod === 'YTD') {
          projectionMonths = Math.max(0, currentMonth - historicalMonths);
        } else if (selectedPeriod === '1Y') {
          projectionMonths = Math.max(0, 12 - historicalMonths);
        } else if (selectedPeriod === '2Y') {
          projectionMonths = Math.max(0, 24 - historicalMonths);
        } else if (selectedPeriod === '5Y') {
          projectionMonths = Math.max(0, 60 - historicalMonths);
        } else if (selectedPeriod === '10Y') {
          projectionMonths = Math.max(0, 120 - historicalMonths);
        } else if (selectedPeriod === '20Y') {
          projectionMonths = Math.max(0, 240 - historicalMonths);
        }
        actualProjectionYears = projectionMonths / 12;
      }
    }


    const startYear = lastYear.year;
    const startMonth = 12;

    for (let i = 1; i <= projectionMonths; i++) {
      currentValue = currentValue * (1 + monthlyReturn) + monthlyContribution;
      totalContributions += monthlyContribution;

      const year = startYear + Math.floor((startMonth + i - 1) / 12);
      const month = ((startMonth + i - 1) % 12) + 1;

      if (viewMode === 'yearly') {
        if (month === 12) {
          labels.push(year.toString());
          amounts.push(currentValue);
          contributions.push(totalContributions);
        }
      } else {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        labels.push(`${monthNames[month - 1]} ${year}`);
        amounts.push(currentValue);
        contributions.push(totalContributions);
      }
    }

    return { labels, amounts, contributions };
  }, [showProjection, data.yearlyData, data.summary.totalContributions, data.summary.netInvestment, marketData, primaryIndex, projectionYears, viewMode, autoProjectionEnabled, selectedPeriod]);

  // Memoize getVisibleDataPoints to prevent unnecessary re-creation
  const getVisibleDataPoints = useCallback((chart: any) => {
    if (!chart || !chart.scales || !chart.scales.x) return 0;
    
    const xScale = chart.scales.x;
    const visibleMin = xScale.min || 0;
    const visibleMax = xScale.max || xScale.ticks.length - 1;
    
    return Math.max(1, Math.floor(visibleMax - visibleMin));
  }, []);

  // Memoize checkAndEnableAutoProjection to prevent unnecessary re-creation
  const checkAndEnableAutoProjection = useCallback((filteredData: any[], isUserAction = false) => {
    const visibleDataPoints = chartRef.current ? getVisibleDataPoints(chartRef.current) : filteredData.length;
    
    if (visibleDataPoints < 5 && !showProjection && !isUserAction) {
      setAutoProjectionEnabled(true);
      setShowProjection(true);
    } else if (visibleDataPoints >= 10 && autoProjectionEnabled && !isUserAction) {
      setAutoProjectionEnabled(false);
      setShowProjection(false);
    }
  }, [showProjection, autoProjectionEnabled, getVisibleDataPoints]);

  // Memoize chart data to prevent unnecessary re-creation
  const chartData = useMemo(() => {
    let currentBaseData = viewMode === 'yearly' ? data.yearlyData : data.monthlyData;
    
    // For yearly view with MAX filter, add partial year data if available
     if (viewMode === 'yearly' && selectedPeriod === 'MAX' && data.monthlyData.length > 0) {
       const lastYearlyData = data.yearlyData[data.yearlyData.length - 1];
       const lastMonthlyData = data.monthlyData[data.monthlyData.length - 1];
       
       // Check if we have monthly data beyond the last complete year
       if (lastMonthlyData && lastYearlyData && 
           (lastMonthlyData.year || new Date().getFullYear()) > lastYearlyData.year) {
         // Add a partial year data point with proper yearly data structure
         const partialYearData = {
           year: lastMonthlyData.year || new Date().getFullYear(),
           amount: lastMonthlyData.amount,
           contributions: lastMonthlyData.contributions,
           netInvestment: lastMonthlyData.netInvestment,
           gains: lastMonthlyData.gains,
           roi: lastMonthlyData.gains / (lastMonthlyData.netInvestment || lastMonthlyData.contributions || 1)
         };
         currentBaseData = [...(currentBaseData as typeof data.yearlyData), partialYearData];
       }
     }
    
    const filteredData = filterDataByPeriod(currentBaseData);
    const projectionData = generateProjectionData();
    
    // Debug: Log the data discrepancy
    if (filteredData.length > 0) {
      const lastDataPoint = filteredData[filteredData.length - 1];
      console.log('Chart last data point:', lastDataPoint.amount);
      console.log('Summary final amount:', data.summary?.finalAmount);
      console.log('Data mismatch:', lastDataPoint.amount !== data.summary?.finalAmount);
    }

    const historicalLabels = filteredData.map((item, index) => {
       if (viewMode === 'yearly') {
         // Check if this is a partial year (last item and beyond complete years)
         const isPartialYear = viewMode === 'yearly' && selectedPeriod === 'MAX' && 
                              index === filteredData.length - 1 && 
                              data.monthlyData.length > 0 &&
                              item.year > (data.yearlyData[data.yearlyData.length - 1]?.year || 0);
         
         if (isPartialYear) {
           // Find the number of months for this partial year
           const monthsInPartialYear = data.monthlyData.filter(m => 
             (m.year || new Date().getFullYear()) === item.year
           ).length;
           return `${item.year} (${monthsInPartialYear}m)`;
         }
         
         return item.year.toString();
       } else {
         // Use the actual year and month from the data
         const date = new Date(item.year || new Date().getFullYear(), (item.monthOfYear || item.month) - 1, 1);
         const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
         
         return label;
       }
     });

     const allLabels = [...historicalLabels, ...projectionData.labels];
     const historicalPortfolioValues = filteredData.map((item) => item.amount);
     const historicalContributions = filteredData.map(item => {
       return item.netInvestment || item.contributions;
     });

    // Create separate datasets for historical and projected data
    const historicalDataset = {
       label: 'Portfolio Value',
       data: historicalPortfolioValues,
       borderColor: '#1a73e8',
       backgroundColor: 'rgba(26, 115, 232, 0.1)',
       tension: 0.4,
       borderWidth: 3,
       pointRadius: 4,
       pointBackgroundColor: '#1a73e8',
       pointBorderColor: 'white',
       pointBorderWidth: 2,
       borderDash: [] as number[], // Solid line for historical data
       fill: false,
     };

     const projectedDataset = {
       label: 'Projected Investment Value',
       data: [...Array(Math.max(0, historicalPortfolioValues.length - 1)).fill(null), historicalPortfolioValues[historicalPortfolioValues.length - 1], ...projectionData.amounts],
       borderColor: '#ff9800',
       backgroundColor: 'rgba(255, 152, 0, 0.1)',
       tension: 0.4,
       borderWidth: 3,
       pointRadius: 3,
       pointBackgroundColor: '#ff9800',
       pointBorderColor: 'white',
       pointBorderWidth: 2,
       borderDash: [8, 4] as number[], // Dotted line for projections
       fill: false,
     };

     const historicalContributionsDataset = {
       label: 'Net Investment',
       data: historicalContributions,
       borderColor: '#9c27b0',
       backgroundColor: 'rgba(156, 39, 176, 0.1)',
       tension: 0.4,
       borderWidth: 2,
       pointRadius: 2,
       pointBackgroundColor: '#9c27b0',
       pointBorderColor: 'white',
       pointBorderWidth: 1,
       borderDash: [] as number[], // Solid line for historical data
       fill: false,
     };


     const projectedContributionsDataset = {
       label: 'Projected Net Investment',
       data: [...Array(Math.max(0, historicalContributions.length - 1)).fill(null), historicalContributions[historicalContributions.length - 1], ...projectionData.contributions],
       borderColor: '#9c27b0',
       backgroundColor: 'rgba(156, 39, 176, 0.1)',
       tension: 0.4,
       borderWidth: 2,
       pointRadius: 2,
       pointBackgroundColor: 'rgba(156, 39, 176, 0.6)',
       pointBorderColor: 'white',
       pointBorderWidth: 1,
       borderDash: [5, 5] as number[], // Dotted line for projections
       fill: false,
     };

    const datasets = [historicalDataset];
    
    // Only add projected datasets if there's projection data
    if (projectionData.amounts.length > 0) {
      datasets.push(projectedDataset);
    }
    
    datasets.push(historicalContributionsDataset);
    
    if (projectionData.contributions.length > 0) {
      datasets.push(projectedContributionsDataset);
    }
    
    // Add market index data if available and MAX period is selected


    return {
      labels: allLabels,
      datasets: datasets,
    };
  }, [viewMode, data.yearlyData, data.monthlyData, filterDataByPeriod, generateProjectionData]);

  // Memoize chart options to prevent unnecessary re-creation
  const chartOptions = useMemo((): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20,
            font: {
              size: 14,
              weight: 'normal',
              family: 'Google Sans, Roboto, sans-serif',
            },
            color: '#5f6368',
          },
        },
      title: {
          display: true,
          text: `Investment Growth Over Time (${viewMode === 'yearly' ? 'Yearly' : 'Monthly'} View)`,
          font: {
            size: 18,
            weight: 'normal',
            family: 'Google Sans, Roboto, sans-serif',
          },
          color: '#202124',
          padding: {
            bottom: 30,
          },
        },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(32, 33, 36, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#5f6368',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'normal',
          family: 'Google Sans, Roboto, sans-serif',
        },
        bodyFont: {
          size: 13,
          weight: 'normal',
          family: 'Google Sans, Roboto, sans-serif',
        },
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = formatCurrency(context.parsed.y);
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(218, 220, 224, 0.5)',
          lineWidth: 1,
        },
        ticks: {
          color: '#5f6368',
          font: {
            size: 12,
            weight: 'normal',
            family: 'Google Sans, Roboto, sans-serif',
          },
        },
        title: {
          display: true,
          text: 'Time Period',
          color: '#202124',
          font: {
            size: 14,
            weight: 'normal',
            family: 'Google Sans, Roboto, sans-serif',
          },
          padding: {
            top: 10,
          },
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          lineWidth: 1,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
            weight: 'normal',
          },
          callback: function(value) {
            return formatCurrency(Number(value));
          },
        },
        title: {
          display: true,
          text: 'Amount ($)',
          color: '#202124',
          font: {
            size: 14,
            weight: 'normal',
            family: 'Google Sans, Roboto, sans-serif',
          },
          padding: {
            bottom: 10,
          },
        },
      },

    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  }), [viewMode, formatCurrency, selectedPeriod]);

  // Memoize view toggle handler
  const handleViewModeChange = useCallback((mode: 'yearly' | 'monthly') => {
    setViewMode(mode);
    
    // Check if auto-projection should be enabled for the new view mode
    setTimeout(() => {
      const baseData = mode === 'yearly' ? data.yearlyData : data.monthlyData;
      const filteredData = filterDataByPeriod(baseData);
      checkAndEnableAutoProjection(filteredData, true);
    }, 0);
  }, [data.yearlyData, data.monthlyData, filterDataByPeriod, checkAndEnableAutoProjection]);

  // Memoize period selection handler
  const handlePeriodChange = useCallback((period: string) => {
    setSelectedPeriod(period);
    
    // Automatically enable projection for projection periods
    if (period.startsWith('+')) {
      setShowProjection(true);
      return;
    }
  }, []);

  // Memoize projection toggle handler
  const handleProjectionToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowProjection(e.target.checked);
  }, []);

  // Calculate temporary stats for the filtered time window
  const calculateTemporaryStats = useCallback(() => {
    let currentBaseData = viewMode === 'yearly' ? data.yearlyData : data.monthlyData;
    
    // For yearly view with MAX filter, add partial year data if available (same logic as chart)
    if (viewMode === 'yearly' && selectedPeriod === 'MAX' && data.monthlyData.length > 0) {
      const lastYearlyData = data.yearlyData[data.yearlyData.length - 1];
      const lastMonthlyData = data.monthlyData[data.monthlyData.length - 1];
      
      // Check if we have monthly data beyond the last complete year
      if (lastMonthlyData && lastYearlyData && 
          (lastMonthlyData.year || new Date().getFullYear()) > lastYearlyData.year) {
        // Add a partial year data point with proper yearly data structure
        const partialYearData = {
          year: lastMonthlyData.year || new Date().getFullYear(),
          amount: lastMonthlyData.amount,
          contributions: lastMonthlyData.contributions,
          netInvestment: lastMonthlyData.netInvestment,
          gains: lastMonthlyData.gains,
          roi: lastMonthlyData.gains / (lastMonthlyData.netInvestment || lastMonthlyData.contributions || 1)
        };
        currentBaseData = [...(currentBaseData as typeof data.yearlyData), partialYearData];
      }
    }
    
    // Use the same filtering logic as the chart to ensure consistency
    const filteredData = filterDataByPeriod(currentBaseData);
    
    if (filteredData.length === 0) {
      return {
        currentValue: 0,
        change: 0,
        changePercent: 0,
        period: selectedPeriod
      };
    }
    
    const firstPoint = filteredData[0];
    const lastPoint = filteredData[filteredData.length - 1];
    
    // Match the Current Position calculation method exactly
    const currentValue = lastPoint.amount;
    const startValue = firstPoint.amount;
    
    // Calculate net investment for both points (assuming no withdrawals for simplicity)
    const currentNetInvestment = lastPoint.contributions || lastPoint.amount || 0;
    const startNetInvestment = firstPoint.contributions || firstPoint.amount || 0;
    
    // Calculate net gains using the same method as Current Position: amount - netInvestment
    const currentNetGains = currentValue - currentNetInvestment;
    const startNetGains = startValue - startNetInvestment;
    
    // Calculate the change in net gains during the period
    const netGainsChange = currentNetGains - startNetGains;
    
    // Calculate the change in net investment during the period
    const netInvestmentChange = currentNetInvestment - startNetInvestment;
    
    // For percentage calculation, use the starting net investment as the base
    const baseInvestment = startNetInvestment > 0 ? startNetInvestment : 1; // Avoid division by zero
    
    // Calculate percentage based on net gains change relative to base investment
    const changePercent = (netGainsChange / baseInvestment) * 100;

    return {
      currentValue,
      change: netGainsChange,
      changePercent,
      period: selectedPeriod,
      timeRange: filteredData.length > 1 ? 
        `${viewMode === 'yearly' ? firstPoint.year : 
          new Date(firstPoint.year || new Date().getFullYear(), ((firstPoint as any).monthOfYear || (firstPoint as any).month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${viewMode === 'yearly' ? lastPoint.year : 
          new Date(lastPoint.year || new Date().getFullYear(), ((lastPoint as any).monthOfYear || (lastPoint as any).month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 
        (viewMode === 'yearly' ? firstPoint.year?.toString() : 
          new Date(firstPoint.year || new Date().getFullYear(), ((firstPoint as any).monthOfYear || (firstPoint as any).month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }))
    };
  }, [viewMode, data.yearlyData, data.monthlyData, selectedPeriod, filterDataByPeriod]);
  
  const tempStats = useMemo(() => calculateTemporaryStats(), [calculateTemporaryStats]);

  // Update parent component with stats
  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate(tempStats);
    }
  }, [tempStats, onStatsUpdate]);

  return (
    <div className="interactive-chart">

      <div className="chart-controls">
        <div className="view-toggle">
          <button 
            className={viewMode === 'yearly' ? 'active' : ''}
            onClick={() => handleViewModeChange('yearly')}
          >
            Yearly View
          </button>
          <button 
            className={viewMode === 'monthly' ? 'active' : ''}
            onClick={() => handleViewModeChange('monthly')}
          >
            Monthly View
          </button>
        </div>
        
        <div className="period-selector">
          {getAvailablePeriods().map((period) => (
            <button
              key={period}
              className={selectedPeriod === period ? 'active' : ''}
              onClick={() => handlePeriodChange(period)}
            >
              {period}
            </button>
          ))}
        </div>
        
        <div className="projection-controls">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showProjection}
              onChange={handleProjectionToggle}
            />
            Show Future Projection
          </label>
        </div>
      </div>
      
      <div className="chart-container">
        <Line ref={chartRef} data={chartData} options={chartOptions} />
      </div>
      
      {autoProjectionEnabled && (
        <div className="projection-notice">
          <p className="auto-projection-notice">🔮 Future projection automatically enabled due to limited data points in selected time window</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(InteractiveChart);
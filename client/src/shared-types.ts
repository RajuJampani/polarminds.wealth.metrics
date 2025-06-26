// Shared type definitions for the compound interest calculator
// This file can be imported by both client and server for type consistency

export interface Transaction {
  date: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
}

export interface HistoricalDataPoint {
  year: number;
  return: number;
  returnPercentage: string;
  index: string;
  indexName: string;
  date?: string;
}

export interface MarketIndex {
  name: string;
  averageReturn: number;
  historicalData: HistoricalDataPoint[];
}

export interface MarketIndices {
  [key: string]: MarketIndex;
}

export interface MonthlyDataPoint {
  month: number;
  year: number;
  monthOfYear: number;
  date: string;
  amount: number;
  contributions: number;
  netInvestment: number;
  gains: number;
  annualReturn: string;
}

export interface YearlyDataPoint {
  year: number;
  date?: string;
  amount: number;
  contributions: number;
  netInvestment?: number;
  gains: number;
  roi: number;
  annualReturn?: string;
}

export interface CalculationSummary {
  finalAmount: number;
  totalContributions: number;
  totalGains: number;
  totalROI: number;
  totalDeposits?: number;
  totalWithdrawals?: number;
  netInvestment?: number;
  netGains?: number;
  netROI?: number;
  averageAnnualReturn: string;
  investmentPeriod: {
    startDate: string;
    endDate: string;
    totalMonths: number;
  };
}

export interface CalculationResult {
  summary: CalculationSummary;
  monthlyData: MonthlyDataPoint[];
  yearlyData: YearlyDataPoint[];
}

export interface CalculationRequest {
  initialAmount?: number;
  principal?: number;
  transactions?: Transaction[];
  startDate: string;
  endDate?: string;
  useHistoricalData?: boolean;
  marketIndex?: string;
}

export interface MarketDataResponse {
  index: string;
  indexName: string;
  averageReturn: number;
  historicalData: HistoricalDataPoint[];
  lastUpdated: string;
  period?: {
    startDate: string;
    endDate: string;
  };
}

export interface MarketIndexInfo {
  id: string;
  name: string;
  averageReturn: number;
}

export interface HistoricalReturns {
  [year: number]: number;
}

export interface AllHistoricalReturns {
  [index: string]: HistoricalReturns;
}

// API Response types
export interface ApiErrorResponse {
  error: string;
}

// Market data API types
export type MarketDataApiResponse = MarketDataResponse | ApiErrorResponse;
export type CalculationApiResponse = CalculationResult | ApiErrorResponse;
export type MarketIndicesApiResponse = MarketIndexInfo[] | ApiErrorResponse;
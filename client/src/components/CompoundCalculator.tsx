import React, { useState, useEffect } from 'react';
import { Transaction as SharedTransaction } from '../shared-types';
import './CompoundCalculator.css';

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
    startDate: string;
    endDate: string;
    transactions: Transaction[];
  }) => void;
  loading: boolean;
  sp500Data: SP500Data | null;
}

const CompoundCalculator: React.FC<CompoundCalculatorProps> = ({
  onCalculate,
  loading,
  sp500Data
}) => {
  // No longer need formData since transactions handle everything

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    type: 'deposit' as 'deposit' | 'withdrawal',
    description: ''
  });

  // Removed handleInputChange since we no longer have initial amount and start date fields

  const handleTransactionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  // Auto-calculate when transactions change with debounce
  useEffect(() => {
    if (transactions.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = transactions.length > 0 
        ? transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date
        : new Date().toISOString().split('T')[0];
      
      onCalculate({
        initialAmount: 0, // No initial amount, transactions handle everything
        startDate,
        endDate,
        transactions
      });
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [transactions]);

  const addTransaction = () => {
    if (newTransaction.amount > 0 && newTransaction.date) {
      const transaction: Transaction = {
        id: Date.now().toString(),
        date: newTransaction.date,
        amount: newTransaction.amount,
        type: newTransaction.type,
        description: newTransaction.description || `${newTransaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${formatCurrency(newTransaction.amount)}`
      };
      
      setTransactions(prev => [...prev, transaction].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setNewTransaction({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        type: 'deposit',
        description: ''
      });
    }
  };

  const removeTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };



  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="calculator-container">
      <div className="calculator-main">
        <div className="calculator-header">
          <h2>Investment Calculator</h2>
          {sp500Data && (
            <div className="market-info">
              <span className="market-indicator">📊 S&P 500 Avg: {(sp500Data.averageReturn * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>

        <div className="calculator-form">


          <div className="input-group">
            <label>
              Add Transaction
              <span className="input-hint">Add deposits or withdrawals to see their impact</span>
            </label>
            <div className="transaction-inputs">
              <div className="single-line-input">
                <div className="date-input-wrapper">
                  <label className="input-label">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={newTransaction.date}
                    onChange={handleTransactionChange}
                    min="1990-01-01"
                    max={new Date().toISOString().split('T')[0]}
                    className="transaction-date-modern"
                  />
                </div>
                <div className="type-input-wrapper">
                  <label className="input-label">Type</label>
                  <select
                    name="type"
                    value={newTransaction.type}
                    onChange={handleTransactionChange}
                    className="transaction-type-modern"
                  >
                    <option value="deposit">💰 Deposit</option>
                    <option value="withdrawal">💸 Withdrawal</option>
                  </select>
                </div>
                <div className="amount-input-wrapper">
                  <label className="input-label">Amount</label>
                  <div className="amount-input-modern">
                    <span className="currency-symbol">$</span>
                    <input
                      type="number"
                      name="amount"
                      value={newTransaction.amount || ''}
                      onChange={handleTransactionChange}
                      placeholder="0"
                      min="0"
                      step="100"
                      className="transaction-amount-modern"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addTransaction}
                  disabled={!newTransaction.amount || newTransaction.amount <= 0}
                  className="add-transaction-btn-modern"
                >
                  <span className="btn-icon">+</span>
                  Add
                </button>
              </div>
            </div>
          </div>

          {transactions.length > 0 && (
            <div className="quick-preview">
              <div className="preview-item">
                <span>Investment Period:</span>
                <span className="preview-value">
                  {(() => {
                    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    const start = new Date(sortedTransactions[0].date);
                    const end = new Date();
                    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                    const years = Math.floor(months / 12);
                    const remainingMonths = months % 12;
                    return `${years}y ${remainingMonths}m (since first transaction)`;
                  })()} 
                </span>
              </div>
              <div className="preview-item">
                <span>Total Transactions:</span>
                <span className="preview-value">
                  {transactions.length} transactions
                </span>
              </div>
              <div className="preview-item">
                <span>Net Investment:</span>
                <span className="preview-value">
                  {formatCurrency(transactions.reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount : -t.amount), 0))}
                </span>
              </div>
            </div>
          )}

          {transactions.length > 0 && (
            <div className="transaction-history">
              <div className="history-header">
                <h4 className="history-title">
                  <span className="history-icon">📊</span>
                  Transaction History
                  <span className="transaction-count">({transactions.length})</span>
                </h4>
              </div>
              <div className="transaction-list-modern">
                {transactions.map(transaction => (
                  <div key={transaction.id} className={`transaction-card ${transaction.type}`}>
                    <div className="transaction-left">
                      <div className="transaction-icon-modern">
                        {transaction.type === 'deposit' ? '💰' : '💸'}
                      </div>
                      <div className="transaction-details-modern">
                        <div className="transaction-amount-modern">
                          <span className={`amount-sign ${transaction.type}`}>
                            {transaction.type === 'withdrawal' ? '-' : '+'}
                          </span>
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="transaction-meta">
                          <span className="transaction-date-modern">
                            {new Date(transaction.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="transaction-type-badge">
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeTransaction(transaction.id)}
                      className="remove-transaction-modern"
                      title="Remove transaction"
                    >
                      <span className="remove-icon">×</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {transactions.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>Start Your Investment Journey</h3>
              <p>Add your first transaction above to see how your investments would have grown with real S&P 500 returns.</p>
              <div className="example-transactions">
                <small>💡 Try adding a deposit from a few years ago to see the power of compound growth!</small>
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-indicator">
              <span className="spinner"></span>
              <span>Calculating growth...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompoundCalculator;
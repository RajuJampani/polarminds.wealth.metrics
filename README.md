# 📈 Wealth Metrics Calculator

A modern, real-time wealth metrics calculator that uses S&P 500 historical trends to project investment growth. Built with React, TypeScript, and Node.js.

## ✨ Features

- **Real-time Calculations**: Instant wealth metrics calculations based on S&P 500 historical data
- **Interactive Charts**: Drag and explore future projections with Chart.js
- **Modern UI**: Clean, responsive design with smooth animations
- **Investment Tracking**: Track initial investments, monthly contributions, and ROI
- **Future Projections**: Visualize potential growth with interactive projections
- **Mobile Responsive**: Works seamlessly on all devices

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Chart.js** for interactive visualizations
- **Axios** for API communication
- **CSS3** with modern styling and animations

### Backend
- **Node.js** with Express
- **CORS** for cross-origin requests
- **Node-Cache** for data caching
- **Axios** for external API calls

## 📊 Data Source

The calculator uses S&P 500 historical average returns (~10% annually) with simulated volatility for realistic projections. In production, this can be easily integrated with real financial APIs like:

- Alpha Vantage
- Yahoo Finance API
- IEX Cloud
- Polygon.io

## 🛠️ Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/RajuJampani/polarminds.wealth.metrics.git
   cd polarminds.wealth.metrics
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend development server on `http://localhost:3000`

### Manual Installation

If you prefer to install dependencies manually:

1. **Install root dependencies**
   ```bash
   npm install
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

3. **Install client dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Start the servers**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev
   
   # Terminal 2 - Frontend
   cd client
   npm start
   ```

## 📱 Usage

1. **Enter Investment Details**:
   - Initial investment amount
   - Monthly contribution
   - Investment period (1-50 years)

2. **View Results**:
   - Total final amount
   - Total contributions
   - Total gains
   - ROI percentage

3. **Explore Interactive Chart**:
   - Switch between monthly and yearly views
   - Enable future projections
   - Drag the projection slider to see extended forecasts
   - Hover over data points for detailed information

## 🎯 Key Features Explained

### Compound Interest Calculation
The calculator uses the compound interest formula with monthly compounding:
```
A = P(1 + r/n)^(nt) + PMT × [((1 + r/n)^(nt) - 1) / (r/n)]
```

Where:
- A = Final amount
- P = Principal (initial investment)
- r = Annual interest rate (S&P 500 average ~10%)
- n = Number of times interest compounds per year (12)
- t = Time in years
- PMT = Monthly payment (contribution)

### Interactive Projections
- **Drag Functionality**: Extend projections up to 20 additional years
- **Real-time Updates**: Calculations update instantly as you modify inputs
- **Visual Indicators**: Dashed lines clearly show projected vs. historical data

## 🔧 API Endpoints

### GET `/api/sp500-data`
Returns S&P 500 historical data and average returns.

**Response:**
```json
{
  "averageReturn": 0.10,
  "historicalData": [...],
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

### POST `/api/calculate-compound`
Calculates compound interest based on input parameters.

**Request Body:**
```json
{
  "initialAmount": 10000,
  "monthlyContribution": 500,
  "years": 20
}
```

**Response:**
```json
{
  "summary": {
    "finalAmount": 123456.78,
    "totalContributions": 130000,
    "totalGains": 93456.78,
    "totalROI": 71.89
  },
  "monthlyData": [...],
  "yearlyData": [...]
}
```

## 🎨 Customization

### Styling
- Modify CSS files in `/client/src/components/` for component-specific styles
- Update `/client/src/App.css` for global styling
- Color scheme and gradients can be customized in CSS variables

### Data Integration
- Replace mock data in `/server/index.js` with real API calls
- Add API keys in environment variables
- Implement additional financial data sources

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Create a `.env` file in the server directory:
```
PORT=5000
FINANCIAL_API_KEY=your_api_key_here
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- S&P 500 historical data and market insights
- Chart.js for excellent charting capabilities
- React and Node.js communities for amazing tools

---

**Built with ❤️ by PolarMinds**
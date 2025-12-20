# Coffee Tree Platform Frontend

A web-based interface for the Coffee Tree Platform, providing both farmer and investor portals for managing coffee grove investments.

## Features

### Farmer Dashboard
- **Grove Management**: Register and manage coffee groves with location mapping
- **Harvest Reporting**: Submit harvest data with yield and sales information
- **Revenue Tracking**: Monitor earnings and revenue distributions
- **Tree Health Monitoring**: Track tree health scores and maintenance activities
- **Farmer Verification**: Submit documents for farmer credential verification

### Investor Portal
- **Grove Browsing**: Explore available coffee groves with filtering options
- **Token Purchasing**: Invest in coffee tree tokens with detailed projections
- **Portfolio Management**: Track investments, returns, and token holdings
- **Secondary Market**: Trade tokens with other investors
- **Earnings History**: View revenue distributions and earnings over time

### Dashboard Overview
- Platform statistics and market overview
- Real-time coffee pricing data
- Total groves, farmers, and revenue metrics

## Technology Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Mapping**: Leaflet.js for interactive maps
- **Charts**: Chart.js for data visualization
- **Styling**: Custom CSS with responsive design
- **API**: RESTful API integration with the backend

## Getting Started

### Prerequisites
- Node.js (for running the development server)
- Coffee Tree Platform API running on port 3001

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Start the frontend server:
```bash
node server.js
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

### Development

The frontend is built with vanilla JavaScript for simplicity and performance. Key files:

- `index.html` - Main HTML structure
- `styles/main.css` - All styling and responsive design
- `js/api.js` - API client for backend communication
- `js/wallet.js` - Wallet connection and user management
- `js/farmer-dashboard.js` - Farmer-specific functionality
- `js/investor-portal.js` - Investor-specific functionality
- `js/main.js` - Main application controller and utilities

### API Integration

The frontend communicates with the backend API running on port 3001. Key endpoints:

- Farmer verification and grove management
- Harvest reporting and revenue distribution
- Market data and pricing information
- Portfolio and earnings tracking

### Wallet Connection

The application simulates wallet connection for demo purposes. In production, this would integrate with:
- HashPack wallet for Hedera network
- Other Hedera-compatible wallets

### User Types

The application automatically determines user type based on the connected wallet:
- **Farmers**: Access grove management, harvest reporting, and revenue tracking
- **Investors**: Access grove browsing, token purchasing, and portfolio management

## Features in Detail

### Grove Registration
- Interactive map for location selection
- Coffee variety and tree count specification
- Expected yield projections
- Verification status tracking

### Harvest Reporting
- Date and yield data entry
- Quality grade assessment
- Sale price recording
- Automatic revenue calculation

### Investment Flow
- Grove browsing with detailed information
- Token purchase with investment projections
- Portfolio tracking with performance metrics
- Secondary market trading capabilities

### Revenue Distribution
- Automatic calculation of token holder shares
- Real-time distribution tracking
- Earnings history and analytics
- Performance visualization

## Responsive Design

The interface is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## Browser Support

Compatible with modern browsers:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

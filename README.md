# 💳 Peymen - Smart Payment Tracker

> A production-grade Progressive Web App (PWA) that automatically syncs and tracks your financial transactions from Gmail with intelligent categorization, real-time analytics, and secure local storage.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Enabled-green.svg)](https://web.dev/progressive-web-apps/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Key Technologies](#key-technologies)
- [Security & Privacy](#security--privacy)
- [Development](#development)
- [Build & Deploy](#build--deploy)
- [Contributing](#contributing)
- [License](#license)
- [Developer](#developer)

---

## 🎯 Overview

Peymen is a sophisticated fintech application that leverages Gmail API to extract payment transaction data from your email inbox. It provides intelligent transaction categorization, spending analytics, and comprehensive financial insights—all while maintaining complete data privacy with local-only storage.

### Key Highlights

- 🔐 **Secure OAuth 2.0 Authentication** via Google
- 📧 **Gmail API Integration** for automatic transaction extraction
- 🤖 **AI-Powered Parsing** using Google Gemini (optional)
- 💾 **Local-First Architecture** with IndexedDB
- 📊 **Real-time Analytics** with interactive charts
- 🔔 **Browser Notifications** for transaction alerts
- ⚡ **Auto-Sync Scheduling** (morning & evening)
- 📱 **Progressive Web App** (PWA) support
- 🎨 **Modern UI/UX** with Tailwind CSS

---

## ✨ Features

### Core Functionality

- **Automatic Transaction Sync**: Seamlessly extract payment data from Gmail emails
- **Smart Categorization**: AI-powered merchant name cleaning and category assignment
- **Multi-Payment Method Support**: UPI, Credit Cards, Debit Cards, Bank Transfers
- **Real-time Dashboard**: Comprehensive overview of your financial activity
- **Advanced Analytics**: Spending trends, category breakdowns, and time-based insights
- **24-Hour Transaction Graph**: Visualize today's spending patterns by hour

### User Experience

- **Intuitive Interface**: Clean, modern design with responsive mobile support
- **Manual Transaction Entry**: Add transactions manually when needed
- **Search & Filter**: Quickly find specific transactions
- **Transaction Details**: View comprehensive information for each transaction
- **Export Capabilities**: Export your transaction data

### Automation

- **Scheduled Auto-Sync**: Configure morning (7 AM) and evening (7 PM) automatic syncs
- **Custom Sync Periods**: Sync for today, last 3 days, week, 15/30/45/90 days, or custom range
- **Background Processing**: Service worker for background sync operations
- **Notification System**: In-app and browser notifications for sync status and new transactions

### Security & Privacy

- **Local-Only Storage**: All data stored on your device using IndexedDB
- **No Server Storage**: Zero data transmission to external servers
- **OAuth 2.0 Security**: Industry-standard authentication
- **Read-Only Gmail Access**: App cannot send, modify, or delete emails
- **Privacy Policy & Terms**: Comprehensive legal documentation

---

## 🛠 Tech Stack

### Frontend

- **React 19.2** - UI library
- **TypeScript 5.8** - Type safety
- **Vite 6.2** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Recharts** - Data visualization

### Backend Services

- **Google OAuth 2.0** - Authentication
- **Gmail API** - Email access
- **Google Gemini AI** - Transaction parsing (optional)

### Data Storage

- **Dexie.js** - IndexedDB wrapper
- **LocalStorage** - Configuration storage

### PWA Features

- **Service Worker** - Background sync and notifications
- **Web App Manifest** - Installable PWA
- **Browser Notifications API** - Desktop notifications

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Google Cloud Console** account (for OAuth credentials)
- **Gmail Account** (for testing)

---

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Payment
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
   VITE_GEMINI_API_KEY=your_gemini_api_key (optional)
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to `http://localhost:3000`

---

## ⚙️ Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Gmail API**
4. Create **OAuth 2.0 Client ID** credentials
5. Add authorized domains:
   - `localhost` (for development)
   - Your production domain
6. Copy the Client ID to `.env.local`

### Gemini API (Optional)

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env.local` as `VITE_GEMINI_API_KEY`
3. If not provided, the app will use basic regex-based parsing

### Application Settings

Configure the following in the app's Settings page:

- Google OAuth Client ID (if not using env variable)
- Gemini API Key (optional)
- Auto-sync schedule (morning & evening times)
- Notification preferences

---

## 📖 Usage

### Initial Setup

1. **Login with Google**

   - Click "Login" button
   - Grant Gmail read-only access
   - Authorize the application

2. **Configure Sync Settings**

   - Navigate to Settings
   - Set up auto-sync times (optional)
   - Configure notification preferences

3. **Sync Transactions**
   - Click "Sync" button
   - Select sync period (today, week, month, etc.)
   - Wait for sync to complete

### Daily Usage

- **View Dashboard**: See spending overview and trends
- **Browse Transactions**: Filter and search through your transactions
- **View Analytics**: Explore spending patterns and insights
- **Manual Entry**: Add transactions manually if needed
- **Auto-Sync**: Let scheduled syncs keep your data up-to-date

---

## 📁 Project Structure

```
Payment/
├── components/          # React components
│   ├── Dashboard.tsx
│   ├── Settings.tsx
│   ├── Analytics.tsx
│   ├── TransactionsList.tsx
│   ├── PrivacyPolicy.tsx
│   ├── TermsOfService.tsx
│   └── ...
├── services/            # Business logic
│   ├── auth.ts         # Google OAuth
│   ├── gmail.ts        # Gmail API integration
│   ├── db.ts           # IndexedDB operations
│   ├── autoSync.ts     # Scheduled sync
│   └── notifications.ts
├── types.ts            # TypeScript type definitions
├── utils/              # Utility functions
├── public/             # Static assets
│   ├── sw.js          # Service worker
│   └── manifest.json  # PWA manifest
├── index.html          # Entry HTML
├── index.tsx           # React entry point
├── App.tsx             # Main app component
├── vite.config.ts      # Vite configuration
└── package.json        # Dependencies
```

---

## 🔑 Key Technologies

### Authentication & API

- **Google OAuth 2.0**: Secure user authentication
- **Gmail API**: Read-only email access for transaction extraction
- **Google Gemini AI**: Intelligent transaction parsing from email content

### Data Management

- **Dexie.js**: Promise-based IndexedDB wrapper for efficient local storage
- **LocalStorage**: Configuration and user preferences
- **React Hooks**: State management and side effects

### UI/UX

- **Tailwind CSS**: Responsive, utility-first styling
- **Lucide React**: Modern icon system
- **Recharts**: Interactive data visualization
- **Custom Design System**: Theme-based color palette and components

### Performance

- **Vite**: Lightning-fast build tool and HMR
- **Code Splitting**: Optimized bundle sizes
- **Service Worker**: Background processing and caching
- **React Memoization**: Optimized re-renders

---

## 🔒 Security & Privacy

### Data Privacy

- ✅ All transaction data stored locally on device
- ✅ No data transmitted to external servers
- ✅ Read-only Gmail access (cannot send/modify/delete emails)
- ✅ User can revoke access anytime via Google Account settings
- ✅ Complete data deletion available in Settings

### Security Measures

- OAuth 2.0 token-based authentication
- HTTPS encryption for all API communications
- Secure local storage with browser security features
- No sensitive data in client-side code
- Environment variables for API keys

### Compliance

- Privacy Policy: `/privacy`
- Terms of Service: `/terms`
- GDPR-friendly architecture
- Transparent data handling

---

## 💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Guidelines

- Follow TypeScript best practices
- Use functional components with hooks
- Maintain consistent code formatting
- Write self-documenting code
- Add comments for complex logic

### Code Style

- **Components**: PascalCase (e.g., `Dashboard.tsx`)
- **Functions**: camelCase (e.g., `handleSync`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (e.g., `Transaction`)

---

## 🚢 Build & Deploy

### Production Build

```bash
npm run build
```

Output will be in the `dist/` directory.

### Deployment Options

#### Netlify

- Configure `public/_redirects` for SPA routing
- Deploy `dist/` folder
- Set environment variables in Netlify dashboard

#### Vercel

- Configure `vercel.json` for routing
- Deploy via Vercel CLI or GitHub integration
- Set environment variables in project settings

#### Other Platforms

- Ensure SPA routing is configured (all routes → `index.html`)
- Set environment variables
- Enable HTTPS

### Environment Variables (Production)

Set the following in your hosting platform:

- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GEMINI_API_KEY` (optional)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 👨‍💻 Developer

**Developed by Vishwjeet Kumar**  
_Software Engineer_

🌐 **Portfolio**: [vishwjeet.me](https://vishwjeet.me)  
📧 **Email**: peymen@vishwjeet.me

---

## 🙏 Acknowledgments

- Google for Gmail API and OAuth 2.0
- React team for the amazing framework
- Vite for the excellent build tool
- All open-source contributors whose libraries made this possible

---

<div align="center">

**Built with ❤️ by [Vishwjeet Kumar](https://vishwjeet.me)**

[Portfolio](https://vishwjeet.me) • [Privacy Policy](/privacy) • [Terms of Service](/terms)

</div>


import React, { useMemo, useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Transaction, SyncProgress, TransactionType } from '../types';
import { formatINR } from '../utils/currency';
import {
  // Cards & Payment
  CreditCard,
  Wallet,
  Banknote,
  CircleDollarSign,

  // Charts & Analytics
  BarChart3,
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart,

  // Actions & Navigation
  Plus,
  ArrowLeft,
  ChevronRight,
  X,
  Search,
  Filter,
  SlidersHorizontal,
  RefreshCw,

  // Shopping & Categories
  ShoppingCart,
  ShoppingBag,
  Film,
  Utensils,
  Car,
  Home as HomeIcon,
  Zap,
  Heart,
  GraduationCap,
  Plane,
  Coffee,
  Package,

  // Status & Indicators
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Star,
  Sparkles,

  // Calendar & Time
  Calendar,
  CalendarDays,

  // Currency
  IndianRupee,
} from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  onAddClick?: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  syncProgress?: SyncProgress;
  onTransactionClick?: (transaction: Transaction) => void;
  onNavigateToTransactions?: () => void;
  onNavigateToAnalytics?: () => void;
}

// All available categories
const ALL_CATEGORIES = [
  'All', 'Shopping', 'Dining', 'Transport', 'Groceries', 'Entertainment',
  'Utilities', 'Health', 'Subscription', 'Income', 'Transfer', 'Rent',
  'Loan', 'Insurance', 'Education', 'Investment', 'Travel', 'Cash', 'General'
];

// Professional category icon mapping
const getCategoryIcon = (category: string, size: number = 18) => {
  const iconProps = { size, strokeWidth: 2 };

  switch (category.toLowerCase()) {
    case 'shopping':
      return <ShoppingBag {...iconProps} />;
    case 'dining':
      return <Utensils {...iconProps} />;
    case 'transport':
      return <Car {...iconProps} />;
    case 'groceries':
      return <ShoppingCart {...iconProps} />;
    case 'entertainment':
      return <Film {...iconProps} />;
    case 'utilities':
      return <Zap {...iconProps} />;
    case 'health':
      return <Heart {...iconProps} />;
    case 'subscription':
      return <Package {...iconProps} />;
    case 'income':
      return <ArrowUpCircle {...iconProps} />;
    case 'transfer':
      return <ArrowDownCircle {...iconProps} />;
    case 'rent':
      return <HomeIcon {...iconProps} />;
    case 'loan':
      return <Banknote {...iconProps} />;
    case 'insurance':
      return <ShieldCheck {...iconProps} />;
    case 'education':
      return <GraduationCap {...iconProps} />;
    case 'investment':
      return <TrendingUp {...iconProps} />;
    case 'travel':
      return <Plane {...iconProps} />;
    case 'cash':
      return <Wallet {...iconProps} />;
    case 'general':
    default:
      return <CircleDollarSign {...iconProps} />;
  }
};

const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  onAddClick,
  onSync,
  isSyncing,
  syncProgress,
  onTransactionClick,
  onNavigateToTransactions,
  onNavigateToAnalytics
}) => {
  const { isOnline, isOffline } = useOnlineStatus();
  const [selectedCardSource, setSelectedCardSource] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Filter states for main view
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filterCardNumber, setFilterCardNumber] = useState<string>('All');
  const [chartPeriod, setChartPeriod] = useState<'T' | 'W' | 'M' | 'Y'>('M');
  const [expensePeriod, setExpensePeriod] = useState<'7d' | '30d' | 'month'>('30d');
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState<number>(new Date().getMonth());
  const [selectedExpenseYear, setSelectedExpenseYear] = useState<number>(new Date().getFullYear());
  const [showExpenseFilter, setShowExpenseFilter] = useState<boolean>(false);
  const [mobileSpendPeriod, setMobileSpendPeriod] = useState<'today' | '7days' | 'month'>('today');

  // Extract last 4 digits from card/source string
  const extractLast4Digits = (source: string): string | null => {
    // Match patterns like ****1234 or ending with 4 digits
    const match = source.match(/\*{4}(\d{4})(?!\d)|(\d{4})$/);
    return match ? (match[1] || match[2]) : null;
  };

  // Extract all card numbers from a source string (for multi-card sources)
  const extractAllCardNumbers = (source: string): string[] => {
    const matches = source.match(/\*{4}(\d{4})/g);
    if (!matches) return [];
    return matches.map(m => m.replace(/\*/g, '')).filter((v, i, a) => a.indexOf(v) === i);
  };

  // Get primary card number (first one found)
  const getPrimaryCardNumber = (source: string): string | null => {
    const allCards = extractAllCardNumbers(source);
    return allCards.length > 0 ? allCards[0] : extractLast4Digits(source);
  };

  // Get unique card numbers from all transactions
  const uniqueCardNumbers = useMemo(() => {
    const cardNumbers = new Set<string>();
    transactions.forEach(t => {
      const primaryCard = getPrimaryCardNumber(t.source);
      if (primaryCard) {
        cardNumbers.add(primaryCard);
      }
    });
    return Array.from(cardNumbers).sort();
  }, [transactions]);

  // Helper functions for card/bank detection (must be defined before cardInsights)
  const getCardBrand = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('visa')) return 'Visa';
    if (s.includes('mastercard') || s.includes('master')) return 'Mastercard';
    if (s.includes('amex') || s.includes('american')) return 'Amex';
    if (s.includes('upi')) return 'UPI';
    return 'Card';
  };

  // Get bank name from source - Enhanced for credit cards
  const getBankName = (source: string): string => {
    const s = source.toLowerCase();
    
    // Common bank patterns - Enhanced with more variations
    if (s.includes('sbi') || s.includes('state bank')) return 'SBI';
    if (s.includes('axis')) return 'Axis Bank';
    if (s.includes('icici')) return 'ICICI Bank';
    if (s.includes('hdfc')) return 'HDFC Bank';
    if (s.includes('kotak')) return 'Kotak';
    if (s.includes('pnb') || s.includes('punjab national')) return 'PNB';
    if (s.includes('bob') || s.includes('bank of baroda')) return 'BOB';
    if (s.includes('yes bank') || s.includes('yesbank')) return 'YES Bank';
    if (s.includes('indusind') || s.includes('indus ind')) return 'IndusInd Bank';
    if (s.includes('rbl')) return 'RBL Bank';
    if (s.includes('idfc')) return 'IDFC Bank';
    if (s.includes('standard chartered') || s.includes('stanchart')) return 'Standard Chartered';
    if (s.includes('citibank') || s.includes('citi')) return 'Citibank';
    if (s.includes('hsbc')) return 'HSBC';
    if (s.includes('amex') || s.includes('american express')) return 'American Express';
    
    // Enhanced Pattern Matching for Credit Card Sources
    // Pattern 1: "ICICI Bank Credit ****1005" or "SBI Credit ****6103"
    const bankCardPattern = /^([A-Za-z\s]+?)\s+(?:Bank\s+)?(?:Credit|Debit|Card)/i;
    const bankCardMatch = source.match(bankCardPattern);
    if (bankCardMatch) {
      const bankName = bankCardMatch[1].trim();
      // Validate it's a reasonable bank name
      if (bankName.length >= 3 && bankName.length <= 25 && /^[A-Za-z\s]+$/.test(bankName)) {
        // Handle specific cases
        if (bankName.toLowerCase() === 'icici') return 'ICICI Bank';
        if (bankName.toLowerCase() === 'hdfc') return 'HDFC Bank';
        if (bankName.toLowerCase() === 'axis') return 'Axis Bank';
        if (bankName.toLowerCase() === 'sbi') return 'SBI';
        return bankName;
      }
    }
    
    // Pattern 2: "BankName ****1234" - extract before card number
    const cardNumPattern = /^([A-Za-z\s]+?)\s+\*{4}/i;
    const cardNumMatch = source.match(cardNumPattern);
    if (cardNumMatch) {
      const bankName = cardNumMatch[1].trim();
      if (bankName.length >= 3 && bankName.length <= 25 && !bankName.toLowerCase().includes('upi')) {
        // Handle specific cases
        if (bankName.toLowerCase() === 'icici') return 'ICICI Bank';
        if (bankName.toLowerCase() === 'hdfc') return 'HDFC Bank';
        if (bankName.toLowerCase() === 'axis') return 'Axis Bank';
        if (bankName.toLowerCase() === 'sbi') return 'SBI';
        return bankName;
      }
    }
    
    // Pattern 3: Extract first word(s) if it looks like a bank name
    const words = source.split(/\s+/);
    if (words.length >= 2) {
      // Check for "ICICI Bank", "HDFC Bank", etc.
      const firstTwoWords = `${words[0]} ${words[1]}`.toLowerCase();
      if (firstTwoWords === 'icici bank') return 'ICICI Bank';
      if (firstTwoWords === 'hdfc bank') return 'HDFC Bank';
      if (firstTwoWords === 'axis bank') return 'Axis Bank';
      if (firstTwoWords === 'kotak bank') return 'Kotak Bank';
      if (firstTwoWords === 'yes bank') return 'YES Bank';
      if (firstTwoWords === 'rbl bank') return 'RBL Bank';
      if (firstTwoWords === 'idfc bank') return 'IDFC Bank';
    }
    
    if (words.length > 0) {
      const firstWord = words[0];
      // If first word is a known bank abbreviation or looks like a bank
      if (firstWord.length >= 3 && firstWord.length <= 15 && /^[A-Za-z]+$/.test(firstWord)) {
        // Check if it's not a common non-bank word
        const nonBankWords = ['card', 'debit', 'credit', 'payment', 'transaction', 'upi', 'vpa', 'dear', 'customer', 'gmail'];
        if (!nonBankWords.includes(firstWord.toLowerCase())) {
          // Handle specific single-word banks
          if (firstWord.toLowerCase() === 'icici') return 'ICICI Bank';
          if (firstWord.toLowerCase() === 'hdfc') return 'HDFC Bank';
          if (firstWord.toLowerCase() === 'axis') return 'Axis Bank';
          if (firstWord.toLowerCase() === 'sbi') return 'SBI';
          if (firstWord.toLowerCase() === 'kotak') return 'Kotak';
          return firstWord;
        }
      }
    }
    
    return 'Bank';
  };

  // Check if source is UPI transaction
  const isUPITransaction = (source: string): boolean => {
    const s = source.toLowerCase();
    return s.includes('upi') || s.includes('vpa') || s.includes('phonepe') || 
           s.includes('googlepay') || s.includes('gpay') || s.includes('paytm') || 
           s.includes('bhim') || s.includes('amazonpay');
  };

  // Group spending by Card Number (not by source string to avoid duplicates)
  const cardInsights = useMemo(() => {
    const cards: Record<string, {
      totalSpent: number;
      count: number;
      lastUsed: Date;
      type: string;
      cardNumber: string;
      brandName: string;
    }> = {};

    transactions.forEach(t => {
      // Filter by selected month and year for "Monthly Spend"
      const tDate = new Date(t.date);
      const isSelectedMonth = tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;

      if (t.type === 'DEBIT' && isSelectedMonth) {
        // Check if it's UPI transaction first
        const isUPI = isUPITransaction(t.source);
        const cardNumber = getPrimaryCardNumber(t.source);

        if (cardNumber && !isUPI) {
          // Use card number as key to group duplicates (only for actual cards, not UPI)
          if (!cards[cardNumber]) {
            // Extract bank name using enhanced function
            const bankName = getBankName(t.source);
            // Extract brand name (e.g., "AXIS Card", "HDFC Visa") as fallback
            const brandMatch = t.source.match(/^([A-Za-z\s]+)(?=\s*\*)/);
            const extractedBrand = brandMatch ? brandMatch[1].trim() : '';
            
            // Use bank name if found, otherwise use extracted brand, fallback to 'Card'
            const brandName = bankName !== 'Bank' ? bankName : (extractedBrand || 'Card');

            cards[cardNumber] = {
              totalSpent: 0,
              count: 0,
              lastUsed: t.date,
              type: `${brandName} ****${cardNumber}`,
              cardNumber: cardNumber,
              brandName: brandName
            };
          }
          const amount = Number(t.amount);
          cards[cardNumber].totalSpent += (Number.isFinite(amount) ? amount : 0);
          cards[cardNumber].count += 1;
          if (new Date(t.date) > new Date(cards[cardNumber].lastUsed)) {
            cards[cardNumber].lastUsed = t.date;
          }
        } else {
          // For non-card transactions (UPI, Cash, etc.)
          const source = t.source || 'Other';
          
          // Group ALL UPI transactions into a single card
          let cardKey = source;
          let brandName = source;
          
          if (isUPI) {
            // Use a common key for all UPI transactions
            cardKey = 'UPI_PAYMENT';
            brandName = 'UPI Payment';
          } else if (source.toLowerCase().includes('gmail sync')) {
            // Group ALL unidentified transactions into a single card
            cardKey = 'UNIDENTIFIED_PAYMENT';
            brandName = 'Unidentified Payment';
          }
          
          if (!cards[cardKey]) {
            cards[cardKey] = {
              totalSpent: 0,
              count: 0,
              lastUsed: t.date,
              type: isUPI ? 'UPI Payment' : (cardKey === 'UNIDENTIFIED_PAYMENT' ? 'Unidentified Payment' : source),
              cardNumber: '', // No card number for UPI/Unidentified payments
              brandName: brandName
            };
          }
          const amount = Number(t.amount);
          cards[cardKey].totalSpent += (Number.isFinite(amount) ? amount : 0);
          cards[cardKey].count += 1;
          if (new Date(t.date) > new Date(cards[cardKey].lastUsed)) {
            cards[cardKey].lastUsed = t.date;
          }
        }
      }
    });

    return Object.values(cards).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [transactions, selectedMonth, selectedYear]);

  const primaryCard = cardInsights[0] || { totalSpent: 0, type: 'N/A' };

  // Filtered transactions for the selected card and date
  const cardSpecificTransactions = useMemo(() => {
    if (!selectedCardSource) return [];

    // Find the card insight to get the card number
    const selectedCard = cardInsights.find(c => c.type === selectedCardSource);

    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const matchesDate = tDate.getMonth() === selectedMonth &&
        tDate.getFullYear() === selectedYear;

      // Match by card number if available, otherwise by source string
      if (selectedCard && selectedCard.cardNumber) {
        const txCardNumber = getPrimaryCardNumber(t.source);
        return matchesDate && txCardNumber === selectedCard.cardNumber;
      } else {
        // For Unidentified Payment, match all unidentified transactions (including Auto Pay, Failed)
        if (selectedCardSource === 'Unidentified Payment') {
          const source = (t.source || '').toLowerCase();
          return matchesDate && source.includes('gmail sync');
        }
        // For UPI transactions, match all UPI sources when "UPI Payment" is selected
        if (selectedCardSource === 'UPI Payment') {
          const isUPI = isUPITransaction(t.source);
          return matchesDate && isUPI;
        }
        // For non-card sources (Cash, etc.)
        return matchesDate && t.source === selectedCardSource;
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedCardSource, selectedMonth, selectedYear, cardInsights]);

  // Filtered transactions for main view
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filterType === 'ALL' || t.type === filterType;
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      const matchesSearch = searchQuery === '' ||
        t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.rawSnippet.toLowerCase().includes(searchQuery.toLowerCase());

      // Card number filter - check primary card number
      const matchesCardNumber = filterCardNumber === 'All' ||
        (getPrimaryCardNumber(t.source) === filterCardNumber);

      return matchesType && matchesCategory && matchesSearch && matchesCardNumber;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, filterCategory, searchQuery, filterCardNumber]);

  // Categorized Data for Overview Lists
  const recentActivity = useMemo(() => filteredTransactions.filter(t => t.type === 'DEBIT').slice(0, 4), [filteredTransactions]);
  const recentInflow = useMemo(() => filteredTransactions.filter(t => t.type === 'CREDIT').slice(0, 4), [filteredTransactions]);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Calculate totals
  const totalCredit = useMemo(() =>
    transactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalDebit = useMemo(() =>
    transactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const monthlyTotalDebit = useMemo(() =>
    transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'DEBIT' && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }).reduce((sum, t) => {
      const amount = Number(t.amount);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0),
    [transactions, selectedMonth, selectedYear]
  );

  // Calculate total expenses based on selected period
  const totalExpenses = useMemo(() => {
    const now = new Date();
    let filteredTransactions = transactions.filter(t => t.type === 'DEBIT');

    if (expensePeriod === '7d') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= sevenDaysAgo);
    } else if (expensePeriod === '30d') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    } else if (expensePeriod === 'month') {
      filteredTransactions = filteredTransactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === selectedExpenseMonth && d.getFullYear() === selectedExpenseYear;
      });
    }

    return filteredTransactions.reduce((sum, t) => {
      const amount = Number(t.amount);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
  }, [transactions, expensePeriod, selectedExpenseMonth, selectedExpenseYear]);

  const balance = totalCredit - totalDebit;

  // Calculate mobile hero total spend based on selected period
  const mobileTotalSpend = useMemo(() => {
    const now = new Date();
    let filteredTransactions = transactions.filter(t => t.type === 'DEBIT');

    if (mobileSpendPeriod === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= todayStart);
    } else if (mobileSpendPeriod === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= sevenDaysAgo);
    } else if (mobileSpendPeriod === 'month') {
      filteredTransactions = filteredTransactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }

    return filteredTransactions.reduce((sum, t) => {
      const amount = Number(t.amount);
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
  }, [transactions, mobileSpendPeriod]);

  // Today's transactions by hour (24 hours)
  const todayHourlyData = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    // Initialize all 24 hours with 0
    const hourlyData: Record<number, number> = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = 0;
    }
    
    // Calculate spending per hour for today
    transactions.forEach(t => {
      if (t.type === 'DEBIT') {
        // Handle both Date objects and date strings
        let tDate: Date;
        if (t.date instanceof Date) {
          tDate = t.date;
        } else if (typeof t.date === 'string') {
          tDate = new Date(t.date);
        } else {
          tDate = new Date(t.date);
        }
        
        // Check if date is valid
        if (isNaN(tDate.getTime())) {
          return;
        }
        
        // Check if transaction is from today
        const tDateOnly = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
        const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (tDateOnly.getTime() === todayOnly.getTime()) {
          const hour = tDate.getHours();
          const amount = Number(t.amount);
          if (Number.isFinite(amount) && amount > 0) {
            hourlyData[hour] = (hourlyData[hour] || 0) + amount;
          }
        }
      }
    });
    
    // Create data array with proper formatting
    return Array.from({ length: 24 }, (_, hour) => {
      const hourValue = hourlyData[hour] || 0;
      const timeLabel = hour < 12 
        ? `${hour.toString().padStart(2, '0')}:00 AM`
        : hour === 12
        ? '12:00 PM'
        : `${(hour - 12).toString().padStart(2, '0')}:00 PM`;
      
      return {
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        timeLabel,
        value: Math.round(hourValue * 100) / 100, // Round to 2 decimal places
        displayValue: hourValue > 0 ? hourValue : 0
      };
    });
  }, [transactions]);

  // Dynamic chart data based on real transactions and selected period
  const chartData = useMemo(() => {
    const now = new Date();
    const data: Record<string, number> = {};

    if (chartPeriod === 'W') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('en-IN', { weekday: 'short' });
        data[dayName] = 0;
      }

      // Calculate spending per day
      transactions.forEach(t => {
        if (t.type === 'DEBIT') {
          const tDate = new Date(t.date);
          const daysDiff = Math.floor((now.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 0 && daysDiff <= 6) {
            const dayName = tDate.toLocaleDateString('en-IN', { weekday: 'short' });
            if (data.hasOwnProperty(dayName)) {
              data[dayName] += t.amount;
            }
          }
        }
      });
    } else if (chartPeriod === 'M') {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = months[date.getMonth()];
        data[monthName] = 0;
      }

      // Calculate spending per month
      transactions.forEach(t => {
        if (t.type === 'DEBIT') {
          const tDate = new Date(t.date);
          const monthName = months[tDate.getMonth()];
          if (data.hasOwnProperty(monthName)) {
            data[monthName] += t.amount;
          }
        }
      });
    } else if (chartPeriod === 'Y') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = months[date.getMonth()];
        data[monthName] = 0;
      }

      // Calculate spending per month
      transactions.forEach(t => {
        if (t.type === 'DEBIT') {
          const tDate = new Date(t.date);
          const monthName = months[tDate.getMonth()];
          if (data.hasOwnProperty(monthName)) {
            data[monthName] += t.amount;
          }
        }
      });
    }

    return Object.entries(data).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }));
  }, [transactions, chartPeriod]);

  // Get card network (Visa, Mastercard, UPI, etc.)
  const getCardNetwork = (source: string): string => {
    const s = source.toLowerCase();
    if (s.includes('upi')) return 'UPI';
    if (s.includes('visa')) return 'VISA';
    if (s.includes('mastercard') || s.includes('master')) return 'Mastercard';
    if (s.includes('amex') || s.includes('american express')) return 'Amex';
    if (s.includes('rupay')) return 'RuPay';
    return 'VISA'; // Default
  };

  // Get display name for cardholder/payment method
  const getCardholderName = (source: string, brandName: string): string => {
    // Handle unidentified payments - return professional term
    if (source.toLowerCase().includes('gmail sync')) {
      return 'Unidentified Payment';
    }
    
    if (isUPITransaction(source)) {
      // If brandName already has "UPI" in it, use it directly
      if (brandName && brandName.toLowerCase().includes('upi')) {
        return brandName;
      }
      // Otherwise extract bank name from source
      const bankName = getBankName(source);
      if (bankName !== 'Bank') {
        return `${bankName} UPI`;
      }
      // Try to extract from source like "HDFC Bank UPI 3556"
      const bankMatch = source.match(/^([A-Za-z\s]+?)\s*(?:Bank\s+)?UPI/i);
      if (bankMatch) {
        return `${bankMatch[1].trim()} UPI`;
      }
      return 'UPI Payment';
    }
    
    // For cards, prioritize bank name extraction
    const extractedBankName = getBankName(source);
    if (extractedBankName !== 'Bank') {
      return extractedBankName;
    }
    
    // Use brandName if available and meaningful
    if (brandName && brandName !== 'Card' && brandName !== 'CARDHOLDER' && brandName !== 'Bank') {
      return brandName;
    }
    
    // Extract from source for cards - Enhanced patterns
    // Pattern 1: "ICICI Bank Credit ****1005" -> "ICICI Bank"
    const bankCardPattern = source.match(/^([A-Za-z\s]+?)\s+(?:Bank\s+)?(?:Credit|Debit|Card)/i);
    if (bankCardPattern) {
      const extracted = bankCardPattern[1].trim();
      if (extracted.length >= 3 && extracted.length <= 25) {
        // Handle specific cases
        if (extracted.toLowerCase() === 'icici') return 'ICICI Bank';
        if (extracted.toLowerCase() === 'hdfc') return 'HDFC Bank';
        if (extracted.toLowerCase() === 'axis') return 'Axis Bank';
        if (extracted.toLowerCase() === 'sbi') return 'SBI';
        return extracted;
      }
    }
    
    // Pattern 2: "BankName ****1234" -> "BankName"
    const brandMatch = source.match(/^([A-Za-z\s]+)(?=\s*\*)/);
    if (brandMatch) {
      const extracted = brandMatch[1].trim();
      if (extracted.length >= 3 && extracted.length <= 25) {
        // Handle specific cases
        if (extracted.toLowerCase() === 'icici') return 'ICICI Bank';
        if (extracted.toLowerCase() === 'hdfc') return 'HDFC Bank';
        if (extracted.toLowerCase() === 'axis') return 'Axis Bank';
        if (extracted.toLowerCase() === 'sbi') return 'SBI';
        return extracted;
      }
    }
    
    // Pattern 3: Try to extract meaningful first word(s)
    const words = source.split(/\s+/);
    if (words.length >= 2) {
      const firstTwoWords = `${words[0]} ${words[1]}`;
      const lowerTwo = firstTwoWords.toLowerCase();
      if (lowerTwo === 'icici bank') return 'ICICI Bank';
      if (lowerTwo === 'hdfc bank') return 'HDFC Bank';
      if (lowerTwo === 'axis bank') return 'Axis Bank';
      if (lowerTwo === 'kotak bank') return 'Kotak Bank';
      if (lowerTwo === 'yes bank') return 'YES Bank';
    }
    
    if (words.length > 0) {
      const firstWord = words[0];
      const nonBankWords = ['card', 'debit', 'credit', 'payment', 'transaction', 'upi', 'vpa', 'dear', 'customer', 'gmail'];
      if (firstWord.length >= 3 && firstWord.length <= 15 && 
          /^[A-Za-z]+$/.test(firstWord) && 
          !nonBankWords.includes(firstWord.toLowerCase())) {
        // Handle specific single-word banks
        if (firstWord.toLowerCase() === 'icici') return 'ICICI Bank';
        if (firstWord.toLowerCase() === 'hdfc') return 'HDFC Bank';
        if (firstWord.toLowerCase() === 'axis') return 'Axis Bank';
        if (firstWord.toLowerCase() === 'sbi') return 'SBI';
        if (firstWord.toLowerCase() === 'kotak') return 'Kotak';
        return firstWord;
      }
    }
    
    // Last resort - return a more meaningful default
    return 'Credit Card';
  };

  // Get professional card design based on bank
  const getCardDesign = (source: string, index: number) => {
    const bankName = getBankName(source);
    const s = source.toLowerCase();
    const isUPI = isUPITransaction(source) || source === 'UPI Payment';
    const isGmailSync = s.includes('gmail sync') || source === 'Unidentified Payment';

    // Unidentified Payments Card Design - Professional Grey gradient
    if (isGmailSync) {
      return {
        bg: 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800',
        accent: 'from-slate-400/20 to-slate-500/20',
        text: 'text-white',
        logo: 'OTHER',
        chip: 'bg-yellow-400',
        network: 'MISC',
        gold: false,
        pattern: null
      };
    }

    // Unified UPI Card Design - Purple/Indigo gradient
    if (isUPI) {
      return {
        bg: 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800',
        accent: 'from-indigo-400/20 to-purple-400/20',
        text: 'text-white',
        logo: 'UPI',
        chip: 'bg-yellow-400',
        network: 'UPI',
        gold: false,
        pattern: null
      };
    }

    // SBI Card Design - Blue
    if (bankName === 'SBI') {
      return {
        bg: 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900',
        accent: 'from-blue-400/20 to-transparent',
        text: 'text-white',
        logo: 'SBI card',
        chip: 'bg-yellow-400',
        network: getCardNetwork(source)
      };
    }

    // Axis Bank Design - Black with Magenta/Pink
    if (bankName === 'Axis Bank') {
      return {
        bg: 'bg-gradient-to-br from-slate-900 via-slate-800 to-black',
        accent: 'from-pink-500/30 via-magenta-500/20 to-transparent',
        text: 'text-white',
        logo: 'AXIS BANK',
        chip: 'bg-yellow-400',
        network: getCardNetwork(source),
        pattern: 'absolute inset-0 bg-gradient-to-r from-pink-500/10 via-magenta-500/5 to-transparent'
      };
    }

    // ICICI Bank Design - Red Gradient
    if (bankName === 'ICICI Bank') {
      return {
        bg: 'bg-gradient-to-br from-red-700 via-red-800 to-red-900',
        accent: 'from-red-500/20 to-transparent',
        text: 'text-white',
        logo: 'ICICI Bank',
        chip: 'bg-yellow-400',
        network: getCardNetwork(source)
      };
    }

    // HDFC Bank Design - Black with Gold
    if (bankName === 'HDFC Bank') {
      return {
        bg: 'bg-gradient-to-br from-slate-900 via-black to-slate-900',
        accent: 'from-yellow-500/10 to-transparent',
        text: 'text-yellow-400',
        logo: 'HDFC BANK',
        chip: 'bg-yellow-400',
        network: getCardNetwork(source),
        gold: true
      };
    }

    // Default Professional Designs based on index
    const defaultDesigns = [
      {
        bg: 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900',
        accent: 'from-indigo-400/20 to-transparent',
        text: 'text-white',
        logo: 'Premium Card',
        chip: 'bg-yellow-400',
        network: getCardNetwork(source)
      },
      {
        bg: 'bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900',
        accent: 'from-purple-400/20 to-transparent',
        text: 'text-white',
        logo: 'Elite Card',
        chip: 'bg-yellow-400',
        network: getCardNetwork(source)
      },
      {
        bg: 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900',
        accent: 'from-slate-500/20 to-transparent',
        text: 'text-white',
        logo: 'Standard Card',
        chip: 'bg-yellow-400',
        network: getCardNetwork(source)
      }
    ];

    return defaultDesigns[index % defaultDesigns.length];
  };

  // Get card display name with last 4 digits
  const getCardDisplayName = (source: string): string => {
    const last4 = extractLast4Digits(source);
    if (last4) {
      const brand = getCardBrand(source);
      return `${brand} ****${last4}`;
    }
    return source;
  };

  // Get initial from name (first letter, uppercase)
  const getNameInitial = (name: string): string => {
    if (!name || name.trim().length === 0) return '?';
    const firstChar = name.trim().charAt(0).toUpperCase();
    return /[A-Z0-9]/.test(firstChar) ? firstChar : '?';
  };

  // Generate consistent gradient color based on name
  const getNameGradient = (name: string): string => {
    if (!name || name.trim().length === 0) return 'from-slate-400 to-slate-500';
    
    // Simple hash function to get consistent color for same name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Predefined beautiful gradient pairs
    const gradients = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-emerald-500 to-emerald-600',
      'from-teal-500 to-teal-600',
      'from-cyan-500 to-cyan-600',
      'from-rose-500 to-rose-600',
      'from-orange-500 to-orange-600',
      'from-amber-500 to-amber-600',
      'from-violet-500 to-violet-600',
      'from-fuchsia-500 to-fuchsia-600',
    ];
    
    // Use hash to select gradient (ensure positive index)
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const resetFilters = () => {
    setFilterType('ALL');
    setFilterCategory('All');
    setSearchQuery('');
    setFilterCardNumber('All');
  };

  // Render the Drill-Down View
  if (selectedCardSource) {
    const activeCard = cardInsights.find(c => c.type === selectedCardSource);
    const monthlyTotal = cardSpecificTransactions.reduce((acc, t) => acc + (t.type === 'DEBIT' ? t.amount : 0), 0);

    return (
      <div className="space-y-6 animate-slide-up pb-10">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedCardSource(null)}
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-[var(--brand-primary)] transition-all active:scale-95"
          >
            <ArrowLeft size={14} />
            Back to Overview
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Viewing</span>
            <div className="px-3 py-1 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-lg text-[10px] font-black uppercase tracking-tighter">
              {getCardBrand(selectedCardSource)} History
            </div>
          </div>
        </div>

        {/* Focused Card Detail Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 glass-card p-6 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CreditCard size={100} strokeWidth={1} />
            </div>
            <div className="relative z-10 space-y-4">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Card Details</p>
                <h4 className="text-xl font-black">{activeCard?.brandName || selectedCardSource}</h4>
                {activeCard?.cardNumber && (
                  <p className="text-sm font-bold mt-1">****{activeCard.cardNumber}</p>
                )}
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">
                  {months[selectedMonth]} {selectedYear} Spend
                </p>
                <h4 className="text-3xl font-black">{formatINR(monthlyTotal)}</h4>
              </div>
              {activeCard && (
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Total Payments</p>
                  <h4 className="text-xl font-black">{activeCard.count}</h4>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 glass-card p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Card Activity Statistics</h3>
                <p className="text-sm font-bold text-slate-800">
                  Tracking {cardSpecificTransactions.length} payments in {months[selectedMonth]} {selectedYear}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <BarChart3 size={20} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">This Month</p>
                <p className="text-xs font-black text-slate-800">{cardSpecificTransactions.length} Txns</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Average/Txn</p>
                <p className="text-xs font-black text-slate-800">
                  {formatINR(monthlyTotal / (cardSpecificTransactions.length || 1))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Month Filter Bar */}
        <div className="glass-card p-4 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            <div className="p-2 bg-slate-50 text-slate-400 rounded-lg mr-2">
              <Calendar size={14} />
            </div>
            {months.map((m, idx) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(idx)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedMonth === idx
                  ? 'bg-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)]/20'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions for this Card */}
        <div className="glass-card p-6 md:p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-50 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-xl flex items-center justify-center">
                <Filter size={18} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{months[selectedMonth]} Payments</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{selectedCardSource}</p>
              </div>
            </div>
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="text"
                placeholder="Search Card History"
                className="bg-slate-50 border-none text-[10px] font-bold py-2 pl-9 pr-4 rounded-xl w-48"
              />
            </div>
          </div>

          <div className="space-y-4">
            {cardSpecificTransactions.length > 0 ? (
              cardSpecificTransactions.map((t, i) => (
                <div
                  key={t.id}
                  onClick={() => onTransactionClick?.(t)}
                  className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 rounded-[1.5rem] group transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110 ${t.type === 'DEBIT' ? 'bg-slate-900' : 'bg-emerald-500'}`}>
                      {getCategoryIcon(t.category, 18)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 leading-tight">{t.merchant}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className={`text-xs font-black ${t.type === 'DEBIT' ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {t.type === 'DEBIT' ? '-' : '+'}{formatINR(t.amount)}
                      </p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{t.category}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-200 group-hover:text-[var(--brand-accent)] transition-colors" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                  <Clock size={32} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No payments for this period</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standard Overview View
  return (
    <div className="space-y-6 lg:space-y-8 animate-slide-up pb-10">

      {/* Mobile Summary Card - Professional Enhanced Design */}
      <div className="lg:hidden balance-card text-white relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        {/* Indian Rupee Watermark - Right Side */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-10 z-0">
          <IndianRupee 
            size={140} 
            strokeWidth={1.5}
            className="text-white"
          />
        </div>
        
        <div className="relative z-10">
          {/* Period Selector - Top Section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-2xl p-1.5 border border-white/20">
              <button
                onClick={() => setMobileSpendPeriod('today')}
                className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                  mobileSpendPeriod === 'today'
                    ? 'bg-white text-[var(--brand-primary)] shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setMobileSpendPeriod('7days')}
                className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                  mobileSpendPeriod === '7days'
                    ? 'bg-white text-[var(--brand-primary)] shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setMobileSpendPeriod('month')}
                className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                  mobileSpendPeriod === 'month'
                    ? 'bg-white text-[var(--brand-primary)] shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                This Month
              </button>
            </div>
          </div>

          {/* Main Content Section */}
          <div className="mb-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-2">Total Spent</p>
                <h3 className="text-3xl font-black leading-tight mb-2">{formatINR(mobileTotalSpend)}</h3>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <p className="text-xs font-bold text-white/80">
                    {mobileSpendPeriod === 'today' 
                      ? 'Today' 
                      : mobileSpendPeriod === '7days' 
                      ? 'Last 7 days' 
                      : `${months[new Date().getMonth()]} ${new Date().getFullYear()}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Top Header */}
      <div className="hidden lg:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-widest">Overview</h2>
          <p className="text-[9px] md:text-xs text-slate-400 font-bold uppercase">Summary</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onSync}
            disabled={isSyncing || isOffline}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${isSyncing || isOffline
              ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 opacity-50 cursor-not-allowed'
              : 'bg-white text-slate-700 border border-slate-100 hover:bg-slate-50 shadow-sm'
              }`}
            title={isOffline ? 'Sync unavailable offline' : 'Sync Gmail'}
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : isOffline ? 'Offline' : 'Sync Gmail'}</span>
          </button>
          <button
            onClick={onAddClick}
            className="flex-1 sm:flex-none bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 flex items-center justify-center gap-2 transition-all hover:bg-black active:scale-95"
          >
            <Plus size={14} />
            <span>Add Payment</span>
          </button>
        </div>
      </div>

      {/* Sync Progress Banner */}
      {isSyncing && syncProgress && syncProgress.status !== 'idle' && (
        <div className="glass-card p-4 bg-[var(--brand-primary)] text-white relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 left-0 h-1 bg-white/30 transition-all duration-500" style={{ width: `${(syncProgress.current / (syncProgress.total || 1)) * 100}%` }} />
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              {syncProgress.status === 'error' ? <AlertCircle size={20} /> : <RefreshCw size={20} className="animate-spin" />}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
                {syncProgress.status === 'fetching' ? 'Connecting to Gmail' : syncProgress.status === 'parsing' ? 'Analyzing Payments' : 'Finishing Up'}
              </p>
              <p className="text-xs font-bold truncate">{syncProgress.message}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase">{syncProgress.current} / {syncProgress.total}</p>
              <p className="text-[8px] font-bold opacity-60">Verified</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Insight Cards - Hidden on Mobile, Visible on Desktop */}
      <div className="hidden lg:grid grid-cols-4 gap-6">
        {[
          {
            title: 'Total Expense',
            value: formatINR(totalDebit),
            sub: `${transactions.filter(t => t.type === 'DEBIT').length} Money Out`,
            icon: ArrowDownCircle,
            color: 'text-rose-500',
            bgColor: 'bg-rose-50',
            gradient: 'from-rose-500/10 to-rose-500/5',
            iconStroke: 2
          },
          {
            title: 'Total Balance',
            value: formatINR(balance),
            sub: `${transactions.length} Payments`,
            icon: CircleDollarSign,
            color: balance >= 0 ? 'text-emerald-500' : 'text-rose-500',
            bgColor: balance >= 0 ? 'bg-emerald-50' : 'bg-rose-50',
            gradient: balance >= 0 ? 'from-emerald-500/10 to-emerald-500/5' : 'from-rose-500/10 to-rose-500/5',
            iconStroke: 2
          },
          {
            title: 'Total Income',
            value: formatINR(totalCredit),
            sub: `${transactions.filter(t => t.type === 'CREDIT').length} Money In`,
            icon: ArrowUpCircle,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-50',
            gradient: 'from-emerald-500/10 to-emerald-500/5',
            iconStroke: 2
          },
          {
            title: 'Your Cards',
            value: cardInsights.length,
            sub: 'Active Sources',
            icon: Wallet,
            color: 'text-[var(--brand-accent)]',
            bgColor: 'bg-[var(--brand-accent)]/10',
            gradient: 'from-[var(--brand-accent)]/10 to-[var(--brand-accent)]/5',
            iconStroke: 2
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`glass-card p-4 lg:p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200 stagger-item animate-slide-up`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {/* Mobile: Compact Horizontal Layout */}
            <div className="lg:hidden flex items-start gap-3">
              <div className={`w-12 h-12 ${card.bgColor} ${card.color} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <card.icon size={20} strokeWidth={card.iconStroke} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{card.title}</p>
                <h4 className="text-lg font-black text-slate-800 mb-0.5 truncate">{typeof card.value === 'number' ? card.value : card.value}</h4>
                <p className="text-[9px] font-medium text-slate-400 truncate">{card.sub}</p>
              </div>
            </div>

            {/* Desktop: Original Vertical Layout */}
            <div className="hidden lg:block space-y-4">
              <div className={`w-10 h-10 ${card.bgColor} ${card.color} rounded-xl flex items-center justify-center`}>
                <card.icon size={20} strokeWidth={card.iconStroke} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 leading-tight mb-1 uppercase tracking-widest truncate">{card.title}</p>
                <div className="flex flex-col md:flex-row md:items-baseline gap-1">
                  <h4 className="text-2xl font-black text-slate-800">{card.value}</h4>
                  <span className="text-[10px] font-bold text-slate-400 truncate">{card.sub}</span>
                </div>
              </div>
            </div>

            {/* Subtle gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
          </div>
        ))}
      </div>


      {/* NEW: My Cards Carousel - Interactive Drill-Down */}
      <section className="space-y-3 md:space-y-4">
        <div className="flex justify-between items-center px-1">
          <div>
            <h3 className="text-sm md:text-sm font-black text-slate-800 uppercase tracking-widest">
              <span className="lg:hidden">In Progress</span>
              <span className="hidden lg:inline">My Cards</span>
            </h3>
            <p className="lg:hidden text-[10px] text-slate-400 font-medium mt-0.5">Active payment sources</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Date Filter Dropdown */}
            <div className="relative">
              <select
                value={`${selectedMonth}-${selectedYear}`}
                onChange={(e) => {
                  const [month, year] = e.target.value.split('-');
                  setSelectedMonth(parseInt(month));
                  setSelectedYear(parseInt(year));
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all appearance-none cursor-pointer pr-8"
              >
                {/* Current Year Options */}
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i;
                  const year = new Date().getFullYear();
                  const monthName = months[month];
                  const isCurrentMonth = month === new Date().getMonth() && year === new Date().getFullYear();
                  return (
                    <option key={`${month}-${year}`} value={`${month}-${year}`}>
                      {isCurrentMonth ? `${monthName} (This Month)` : `${monthName} ${year}`}
                    </option>
                  );
                })}
                
                {/* Previous Year Options (if we have data) */}
                {new Date().getFullYear() > 2024 && Array.from({ length: 12 }, (_, i) => {
                  const month = i;
                  const year = new Date().getFullYear() - 1;
                  const monthName = months[month];
                  return (
                    <option key={`${month}-${year}`} value={`${month}-${year}`}>
                      {monthName} {year}
                    </option>
                  );
                })}
              </select>
              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                <Calendar size={12} className="text-slate-400" />
              </div>
            </div>
            
            <button className="flex items-center gap-1 text-[10px] font-bold text-[var(--brand-primary)] transition-colors hover:text-indigo-800 active:scale-95">
              <span className="lg:hidden">▼</span>
              <Plus size={12} className="hidden lg:inline" />
              <span className="hidden lg:inline">Manage</span>
            </button>
          </div>
        </div>

        {/* Date Filter Info */}
        <div className="flex items-center justify-between px-1 text-[10px] font-bold text-slate-500">
          <span>
            Showing {months[selectedMonth]} {selectedYear} transactions
          </span>
          <span>
            {cardInsights.reduce((sum, card) => sum + card.count, 0)} payments
          </span>
        </div>

        {/* No cards message */}
        {cardInsights.length === 0 && (
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard size={32} className="text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-2">No Cards Yet</h4>
            <p className="text-xs text-slate-500">Add payments to see your cards here</p>
          </div>
        )}

        {/* Professional Bank Cards Carousel */}
        {cardInsights.length > 0 && (
          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:-mx-2 md:px-2 scroll-smooth">
            {cardInsights.map((card, idx) => {
              const cardDesign = getCardDesign(card.type, idx);
              const bankName = getBankName(card.type);
              const cardNetwork = getCardNetwork(card.type);
              const isUPI = isUPITransaction(card.type) || card.type === 'UPI Payment';
              const isGmailSync = card.type === 'Unidentified Payment' || card.type.toLowerCase().includes('gmail sync');
              // For unified UPI card, use "UPI Payment" as brand name
              // For Unidentified Payment, use "Unidentified Payment" as brand name
              const finalBrandName = isUPI ? 'UPI Payment' : (isGmailSync ? 'Unidentified Payment' : card.brandName);
              const cardholderName = isUPI ? 'UPI Payment' : (isGmailSync ? 'Unidentified Payment' : getCardholderName(card.type, finalBrandName));
              
              // Create unique key combining type, cardNumber, and index to avoid duplicates
              const uniqueKey = `${card.type}-${card.cardNumber || 'no-card'}-${idx}`;
              
              return (
                <div
                  key={uniqueKey}
                  onClick={() => setSelectedCardSource(card.type)}
                  className={`min-w-[280px] lg:min-w-[340px] rounded-2xl md:rounded-3xl p-5 md:p-7 text-white relative overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shrink-0 cursor-pointer group aspect-[1.586/1] ${cardDesign.bg}`}
                >
                  {/* Decorative Background Elements */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${cardDesign.accent} opacity-50`} />
                  {cardDesign.pattern && <div className={cardDesign.pattern} />}
                  
                  {/* Card Content */}
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    {/* Top Section - Bank Logo & Contactless */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`px-2.5 py-1 rounded-lg ${cardDesign.gold ? 'bg-yellow-400/20 border border-yellow-400/30' : 'bg-white/10 backdrop-blur-sm'}`}>
                          <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-wider ${cardDesign.text}`}>
                            {isUPI ? 'UPI Payment' : (isGmailSync ? 'GMAIL' : bankName)}
                          </p>
                        </div>
                      </div>
                      {/* Contactless Symbol - Enhanced with Lower Opacity */}
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                          <div className="flex gap-0.5">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="w-0.5 h-2 md:h-2.5 bg-white/40 rounded-full" style={{ height: `${1.5 + i * 0.3}px` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle Section - Card Number & Chip */}
                    <div className="flex-1 flex flex-col justify-center space-y-4">
                      {/* EMV Chip */}
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 md:w-10 md:h-10 ${cardDesign.chip} rounded-md md:rounded-lg flex items-center justify-center shadow-lg`}>
                          <div className="w-6 h-6 md:w-7 md:h-7 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-sm flex items-center justify-center">
                            <div className="grid grid-cols-4 gap-0.5 w-4 h-4">
                              {Array.from({ length: 16 }).map((_, i) => (
                                <div key={i} className="w-0.5 h-0.5 bg-slate-800 rounded-full" />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Number */}
                      <div className="space-y-1">
                        {isUPI ? (
                          // UPI Payment - Show unified UPI logo/icon
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                              <Wallet size={24} className="text-white" strokeWidth={2} />
                            </div>
                            <div>
                              <p className="text-lg md:text-xl font-black tracking-wider">UPI</p>
                              <p className="text-[8px] md:text-[9px] font-bold text-white/60 uppercase tracking-widest">
                                Unified Payments
                              </p>
                            </div>
                          </div>
                        ) : isGmailSync ? (
                          // Unidentified Payment - Show professional misc payment icon
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                              <CircleDollarSign size={24} className="text-white" strokeWidth={2} />
                            </div>
                            <div>
                              <p className="text-lg md:text-xl font-black tracking-wider">OTHER</p>
                              <p className="text-[8px] md:text-[9px] font-bold text-white/60 uppercase tracking-widest">
                                Miscellaneous
                              </p>
                            </div>
                          </div>
                        ) : (
                          // Regular Card - Show card number
                          <>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3].map(i => (
                                <span key={i} className="text-sm md:text-base font-mono tracking-widest">••••</span>
                              ))}
                              <span className="text-sm md:text-base font-mono font-black tracking-widest">
                                {card.cardNumber || '****'}
                              </span>
                            </div>
                            {card.cardNumber && (
                              <p className="text-[8px] md:text-[9px] font-bold text-white/60 uppercase tracking-widest">
                                {card.brandName || getCardBrand(card.type)}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bottom Section - Cardholder/Payment Method, Valid Thru, Network */}
                    <div className="flex items-end justify-between">
                      <div className="flex-1">
                        <p className="text-[7px] md:text-[8px] font-bold text-white/60 uppercase tracking-widest mb-0.5">
                          {isUPI ? 'Payment Method' : isGmailSync ? 'Payment Type' : 'Cardholder'}
                        </p>
                        <p className="text-xs md:text-sm font-black uppercase tracking-wider truncate">
                          {cardholderName}
                        </p>
                      </div>
                      
                      <div className="flex items-end gap-4">
                        {!isUPI && (
                          <div className="text-right">
                            <p className="text-[7px] md:text-[8px] font-bold text-white/60 uppercase tracking-widest mb-0.5">
                              Valid Thru
                            </p>
                            <p className="text-xs font-black">••/••</p>
                          </div>
                        )}
                        
                        {/* Network Logo */}
                        <div className={`px-2 py-1.5 rounded-md ${cardDesign.gold ? 'bg-yellow-400/20 border border-yellow-400/30' : 'bg-white/10 backdrop-blur-sm'}`}>
                          <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-wider ${cardDesign.text}`}>
                            {cardNetwork}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Monthly Spend - Professional Display */}
                    <div className="absolute top-4 right-4 text-right">
                      <p className="text-[7px] md:text-[8px] font-bold text-white/70 uppercase tracking-widest mb-0.5">
                        Monthly Spent
                      </p>
                      <p className="text-sm md:text-base font-black leading-tight">
                        {formatINR(Math.abs(card.totalSpent))}
                      </p>
                      <p className="text-[7px] md:text-[8px] font-bold text-white/60 mt-0.5">
                        {card.count} {card.count === 1 ? 'payment' : 'payments'}
                      </p>
                    </div>
                  </div>

                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                  {/* Indian Rupee Watermark - Right Side */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-10">
                    <IndianRupee 
                      size={140} 
                      strokeWidth={1.5}
                      className="text-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trends Chart Section - Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <div className="lg:col-span-8 glass-card p-5 md:p-6 lg:p-10 flex flex-col">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8 lg:mb-10">
            <div>
              <h3 className="text-slate-800 text-[10px] md:text-sm font-black uppercase tracking-widest">Your Spending</h3>
              <p className="text-slate-400 text-[8px] md:text-[10px] font-bold">
                {chartPeriod === 'T' ? 'Today\'s transactions by hour' : 'All your cards & accounts'}
              </p>
            </div>
            <div className="flex gap-1 md:gap-2">
              {(['T', 'W', 'M', 'Y'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg text-[9px] md:text-[10px] font-extrabold cursor-pointer transition-all active:scale-95 ${
                    chartPeriod === p 
                      ? 'bg-[var(--brand-primary)] text-white shadow-md shadow-indigo-200' 
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                  title={p === 'T' ? 'Today' : p === 'W' ? 'Week' : p === 'M' ? 'Month' : 'Year'}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[180px] md:h-[220px] lg:h-[250px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minHeight={180} minWidth={0}>
              {chartPeriod === 'T' ? (
                <LineChart 
                  data={todayHourlyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.5} />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }} 
                    dy={10}
                    interval={3}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 8, fontWeight: 700, fill: '#64748b' }}
                    width={60}
                    tickFormatter={(value) => {
                      if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
                      return `₹${value}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                      padding: '10px 14px',
                      backgroundColor: '#ffffff'
                    }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}
                    labelStyle={{ fontSize: '10px', fontWeight: 'black', color: '#64748b', marginBottom: '4px' }}
                    formatter={(value: number) => [formatINR(value), 'Spent']}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="displayValue" 
                    stroke="var(--brand-primary)" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: 'var(--brand-primary)', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 8, fill: 'var(--brand-accent)', stroke: '#fff', strokeWidth: 2 }} 
                    connectNulls={false}
                  />
                </LineChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.5} />
                  <Tooltip
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
                    itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                    formatter={(value: number) => formatINR(value)}
                  />
                  <Line type="monotone" dataKey="value" stroke="var(--brand-primary)" strokeWidth={3} dot={{ r: 3, fill: 'var(--brand-primary)', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 700, fill: '#94a3b8' }} dy={8} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 glass-card p-6 lg:p-10 flex flex-row lg:flex-col items-center lg:justify-center text-left lg:text-center gap-4 lg:gap-6">
          <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-[var(--brand-primary)]/10 rounded-2xl md:rounded-full flex items-center justify-center text-[var(--brand-primary)] shrink-0">
            <BarChart3 size={24} className="md:w-8 md:h-8" />
          </div>
          <div className="space-y-1 lg:space-y-2 flex-1">
            <h3 className="text-sm md:text-base lg:text-lg font-black text-slate-800">Smart Analysis</h3>
            <p className="text-[10px] md:text-xs text-slate-400 font-medium">Spending on <span className="text-slate-600 font-bold">{primaryCard.type}</span> is trending higher.</p>
          </div>
          <button 
            onClick={onNavigateToAnalytics}
            className="hidden sm:block lg:w-full py-2.5 md:py-3 px-4 lg:px-0 bg-slate-900 text-white rounded-xl lg:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
            aria-label="View detailed analytics and reports"
          >
            Report
          </button>
        </div>
      </div>

      {/* Bottom Row: Filtered Transaction Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6">
        <div className="lg:col-span-6 glass-card p-5 md:p-6 lg:p-8">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-[10px] md:text-sm font-black text-slate-800 uppercase tracking-widest">Recent Expenses</h3>
            <button 
              onClick={onNavigateToTransactions}
              className="text-[9px] md:text-[10px] font-bold text-[var(--brand-primary)] hover:underline transition-all active:scale-95 cursor-pointer"
            >
              See All
            </button>
          </div>
          <div className="space-y-4 md:space-y-6">
            {recentActivity.length > 0 ? recentActivity.map((t, i) => (
              <div key={i} onClick={() => onTransactionClick?.(t)} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3 lg:gap-4 overflow-hidden">
                  <div className="w-9 h-9 md:w-11 md:h-11 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-[var(--brand-primary)] transition-colors group-hover:bg-[var(--brand-primary)] group-hover:text-white shrink-0">
                    {getCategoryIcon(t.category, 16)}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-[10px] md:text-xs font-black text-slate-800 leading-tight truncate">{t.merchant}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate">{t.source}</p>
                      {getPrimaryCardNumber(t.source) && (
                        <span className="px-1.5 py-0.5 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded text-[7px] font-black">
                          ****{getPrimaryCardNumber(t.source)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] md:text-xs font-black text-rose-500">-{formatINR(t.amount)}</p>
                  <p className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase">{t.category}</p>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase">No expenses found</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 glass-card p-5 md:p-6 lg:p-8">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-[10px] md:text-sm font-black text-slate-800 uppercase tracking-widest">Recent Income</h3>
            <button 
              onClick={onNavigateToTransactions}
              className="text-[9px] md:text-[10px] font-bold text-[var(--brand-primary)] hover:underline transition-all active:scale-95 cursor-pointer"
            >
              See All
            </button>
          </div>
          <div className="space-y-4 md:space-y-6">
            {recentInflow.length > 0 ? recentInflow.map((t, i) => (
              <div key={i} onClick={() => onTransactionClick?.(t)} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3 lg:gap-4 overflow-hidden">
                  <div className={`w-9 h-9 md:w-11 md:h-11 bg-gradient-to-br ${getNameGradient(t.merchant)} rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-sm md:text-base shadow-sm shrink-0 transition-transform group-hover:scale-105`}>
                    {getNameInitial(t.merchant)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] md:text-xs font-black text-slate-800 leading-tight truncate">{t.merchant}</p>
                    <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate">{t.source}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] md:text-xs font-black text-emerald-500">
                    +{formatINR(t.amount)}
                  </span>
                  <p className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase">{t.category}</p>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase">No income found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
};

export default Dashboard;

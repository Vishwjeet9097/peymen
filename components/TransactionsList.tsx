
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatINR } from '../utils/currency';
import { MerchantLogoComponent } from '../utils/merchantLogos';
import { 
  ShoppingBag, 
  CreditCard, 
  ArrowDownCircle, 
  ArrowUpCircle,
  ChevronRight,
  Plus,
  Filter,
  Download,
  Search,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Calendar,
  Tag,
  Wallet,
  Smartphone,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'merchant-asc' | 'merchant-desc' | 'category-asc' | 'category-desc';

interface TransactionsListProps {
  transactions: Transaction[];
  onAddClick?: () => void;
  onTransactionClick?: (transaction: Transaction) => void;
}

const TransactionsList: React.FC<TransactionsListProps> = ({ transactions, onAddClick, onTransactionClick }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCardNumber, setFilterCardNumber] = useState<string>('All');
  const [filterPlatform, setFilterPlatform] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const recordsPerPage = 15;

  // Extract unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(transactions.map(t => t.category));
    return Array.from(uniqueCategories).sort();
  }, [transactions]);

  // Extract unique card numbers
  const cardNumbers = useMemo(() => {
    const extractLast4Digits = (source: string): string | null => {
      const match = source.match(/\*{4}(\d{4})(?!\d)|(\d{4})$/);
      return match ? (match[1] || match[2]) : null;
    };

    const getPrimaryCardNumber = (source: string): string | null => {
      return extractLast4Digits(source);
    };

    const uniqueCards = new Set<string>();
    transactions.forEach(t => {
      const cardNum = getPrimaryCardNumber(t.source);
      if (cardNum) uniqueCards.add(cardNum);
    });
    return Array.from(uniqueCards).sort();
  }, [transactions]);

  // Extract unique platforms/payment sources
  const platforms = useMemo(() => {
    const platformMap = new Map<string, string>();
    
    transactions.forEach(t => {
      const source = t.source.toLowerCase();
      let platform = '';
      
      // Detect platform from source
      if (source.includes('upi') || source.includes('phonepe') || source.includes('google pay') || 
          source.includes('paytm') || source.includes('bhim') || source.includes('amazon pay')) {
        if (source.includes('phonepe')) platform = 'PhonePe';
        else if (source.includes('google pay') || source.includes('gpay')) platform = 'Google Pay';
        else if (source.includes('paytm')) platform = 'Paytm';
        else if (source.includes('amazon pay')) platform = 'Amazon Pay';
        else if (source.includes('bhim')) platform = 'BHIM UPI';
        else platform = 'UPI';
      } else if (source.includes('card') || source.includes('visa') || source.includes('mastercard') || 
                 source.includes('rupay') || source.includes('amex')) {
        if (source.includes('visa')) platform = 'Visa';
        else if (source.includes('mastercard')) platform = 'Mastercard';
        else if (source.includes('rupay')) platform = 'RuPay';
        else if (source.includes('amex')) platform = 'American Express';
        else platform = 'Card';
      } else if (source.includes('cash')) {
        platform = 'Cash';
      } else if (source.includes('netbanking') || source.includes('net banking')) {
        platform = 'Net Banking';
      } else if (source.includes('wallet')) {
        platform = 'Wallet';
      } else if (source.includes('manual')) {
        platform = 'Manual Entry';
      } else {
        // Extract bank name or first word
        const words = t.source.split(' ');
        platform = words[0] || 'Other';
      }
      
      if (platform) {
        platformMap.set(platform, platform);
      }
    });
    
    return Array.from(platformMap.values()).sort();
  }, [transactions]);

  // Enhanced search function - defined before useMemo
  const matchesSearch = React.useCallback((transaction: Transaction, query: string): boolean => {
    if (!query) return true;
    
    const lowerQuery = query.toLowerCase().trim();
    
    // Amount search patterns
    const amountPatterns = [
      /^(\d+(?:\.\d{1,2})?)$/, // Exact amount: "100" or "100.50"
      /^>(\d+(?:\.\d{1,2})?)$/, // Greater than: ">100"
      /^<(\d+(?:\.\d{1,2})?)$/, // Less than: "<100"
      /^(\d+(?:\.\d{1,2})?)-(\d+(?:\.\d{1,2})?)$/, // Range: "100-500"
      /^(\d+(?:\.\d{1,2})?)\+$/, // Greater than or equal: "100+"
      /^(\d+(?:\.\d{1,2})?)-$/, // Less than or equal: "100-"
    ];
    
    // Check amount patterns
    for (const pattern of amountPatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        if (pattern === amountPatterns[0]) {
          // Exact match
          const amount = parseFloat(match[1]);
          return Math.abs(transaction.amount - amount) < 0.01;
        } else if (pattern === amountPatterns[1]) {
          // Greater than
          const amount = parseFloat(match[1]);
          return transaction.amount > amount;
        } else if (pattern === amountPatterns[2]) {
          // Less than
          const amount = parseFloat(match[1]);
          return transaction.amount < amount;
        } else if (pattern === amountPatterns[3]) {
          // Range
          const min = parseFloat(match[1]);
          const max = parseFloat(match[2]);
          return transaction.amount >= min && transaction.amount <= max;
        } else if (pattern === amountPatterns[4]) {
          // Greater than or equal
          const amount = parseFloat(match[1]);
          return transaction.amount >= amount;
        } else if (pattern === amountPatterns[5]) {
          // Less than or equal
          const amount = parseFloat(match[1]);
          return transaction.amount <= amount;
        }
      }
    }
    
    // Platform search
    const platformKeywords = ['upi', 'phonepe', 'google pay', 'gpay', 'paytm', 'amazon pay', 
                              'bhim', 'card', 'visa', 'mastercard', 'rupay', 'cash', 
                              'netbanking', 'wallet', 'manual'];
    const isPlatformSearch = platformKeywords.some(keyword => lowerQuery.includes(keyword));
    
    if (isPlatformSearch) {
      const sourceLower = transaction.source.toLowerCase();
      if (lowerQuery.includes('upi') && (sourceLower.includes('upi') || sourceLower.includes('phonepe') || 
          sourceLower.includes('google pay') || sourceLower.includes('paytm'))) {
        return true;
      }
      if (lowerQuery.includes('phonepe') && sourceLower.includes('phonepe')) return true;
      if ((lowerQuery.includes('google pay') || lowerQuery.includes('gpay')) && 
          (sourceLower.includes('google pay') || sourceLower.includes('gpay'))) return true;
      if (lowerQuery.includes('paytm') && sourceLower.includes('paytm')) return true;
      if (lowerQuery.includes('amazon pay') && sourceLower.includes('amazon pay')) return true;
      if (lowerQuery.includes('card') && sourceLower.includes('card')) return true;
      if (lowerQuery.includes('visa') && sourceLower.includes('visa')) return true;
      if (lowerQuery.includes('mastercard') && sourceLower.includes('mastercard')) return true;
      if (lowerQuery.includes('cash') && sourceLower.includes('cash')) return true;
      if (lowerQuery.includes('wallet') && sourceLower.includes('wallet')) return true;
      if (lowerQuery.includes('manual') && sourceLower.includes('manual')) return true;
    }
    
    // Default text search (merchant, source, notes)
    return (
      transaction.merchant.toLowerCase().includes(lowerQuery) ||
      transaction.source.toLowerCase().includes(lowerQuery) ||
      (transaction.rawSnippet && transaction.rawSnippet.toLowerCase().includes(lowerQuery)) ||
      transaction.category.toLowerCase().includes(lowerQuery)
    );
  }, []);

  // Get platform from transaction source
  const getPlatformFromSource = (source: string): string => {
    const sourceLower = source.toLowerCase();
    
    if (sourceLower.includes('phonepe')) return 'PhonePe';
    if (sourceLower.includes('google pay') || sourceLower.includes('gpay')) return 'Google Pay';
    if (sourceLower.includes('paytm')) return 'Paytm';
    if (sourceLower.includes('amazon pay')) return 'Amazon Pay';
    if (sourceLower.includes('bhim')) return 'BHIM UPI';
    if (sourceLower.includes('upi')) return 'UPI';
    if (sourceLower.includes('visa')) return 'Visa';
    if (sourceLower.includes('mastercard')) return 'Mastercard';
    if (sourceLower.includes('rupay')) return 'RuPay';
    if (sourceLower.includes('amex')) return 'American Express';
    if (sourceLower.includes('card')) return 'Card';
    if (sourceLower.includes('cash')) return 'Cash';
    if (sourceLower.includes('netbanking') || sourceLower.includes('net banking')) return 'Net Banking';
    if (sourceLower.includes('wallet')) return 'Wallet';
    if (sourceLower.includes('manual')) return 'Manual Entry';
    
    // Extract bank name or first word
    const words = source.split(' ');
    return words[0] || 'Other';
  };

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    const extractLast4Digits = (source: string): string | null => {
      const match = source.match(/\*{4}(\d{4})(?!\d)|(\d{4})$/);
      return match ? (match[1] || match[2]) : null;
    };

    const getPrimaryCardNumber = (source: string): string | null => {
      return extractLast4Digits(source);
    };

    // First filter the transactions
    const filtered = transactions.filter(t => {
      const matchesType = filterType === 'ALL' || t.type === filterType;
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      const matchesSearchQuery = matchesSearch(t, searchQuery);
      const matchesCard = filterCardNumber === 'All' ||
        (getPrimaryCardNumber(t.source) === filterCardNumber);
      const matchesPlatform = filterPlatform === 'All' ||
        (getPlatformFromSource(t.source) === filterPlatform);

      return matchesType && matchesCategory && matchesSearchQuery && matchesCard && matchesPlatform;
    });

    // Then sort the filtered results
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        case 'merchant-asc':
          return a.merchant.localeCompare(b.merchant);
        case 'merchant-desc':
          return b.merchant.localeCompare(a.merchant);
        case 'category-asc':
          return a.category.localeCompare(b.category);
        case 'category-desc':
          return b.category.localeCompare(a.category);
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  }, [transactions, filterType, filterCategory, searchQuery, filterCardNumber, filterPlatform, sortBy, matchesSearch, getPlatformFromSource]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters or sorting change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterCategory, searchQuery, filterCardNumber, filterPlatform, sortBy]);

  const hasActiveFilters = filterType !== 'ALL' || filterCategory !== 'All' || searchQuery !== '' || filterCardNumber !== 'All' || filterPlatform !== 'All' || sortBy !== 'date-desc';

  const resetFilters = () => {
    setFilterType('ALL');
    setFilterCategory('All');
    setSearchQuery('');
    setFilterCardNumber('All');
    setFilterPlatform('All');
    setSortBy('date-desc');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-slide-up pb-6 sm:pb-10">
      {/* Header Section - Mobile Optimized */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Financial History</h2>
          <p className="text-slate-400 text-[10px] sm:text-xs md:text-sm font-medium mt-1">Real-time sync from your connected accounts.</p>
        </div>
        
        {/* Enhanced Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-500" strokeWidth={2.5} />
          </div>
          <input
            type="text"
            placeholder="Search by store, amount, platform, card, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-11 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 flex items-center justify-center w-9 h-9 my-auto text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all active:scale-95"
              aria-label="Clear search"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>
        
        {/* Action Buttons with Sort - Mobile Optimized */}
        <div className="flex gap-2">
          <button 
            onClick={onAddClick}
            className="flex-1 sm:flex-none bg-slate-900 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-sm transition-all hover:bg-black active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus size={16} className="sm:w-4 sm:h-4" />
            <span className="hidden min-[375px]:inline">Add Payment</span>
            <span className="min-[375px]:hidden">Add</span>
          </button>
          
          {/* Sort Dropdown */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-sm border bg-white text-slate-600 border-slate-100 hover:bg-slate-50 transition-all appearance-none cursor-pointer pr-8"
            >
              <option value="date-desc">Latest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">High to Low ₹</option>
              <option value="amount-asc">Low to High ₹</option>
              <option value="merchant-asc">Store A-Z</option>
              <option value="merchant-desc">Store Z-A</option>
              <option value="category-asc">Category A-Z</option>
              <option value="category-desc">Category Z-A</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <ArrowUpDown size={14} className="text-slate-400" />
            </div>
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 sm:flex-none px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-sm border transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${
              showFilters || hasActiveFilters
                ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90' 
                : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
            }`}
          >
            <Filter size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden min-[375px]:inline">Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[8px]">
                {[filterType !== 'ALL' ? 1 : 0, filterCategory !== 'All' ? 1 : 0, filterCardNumber !== 'All' ? 1 : 0, filterPlatform !== 'All' ? 1 : 0, sortBy !== 'date-desc' ? 1 : 0].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </button>
          <button className="flex-1 sm:flex-none bg-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-600 shadow-sm border border-slate-100 transition-all hover:bg-slate-50 active:scale-[0.98] flex items-center justify-center gap-1.5">
            <Download size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden min-[375px]:inline">Export</span>
          </button>
        </div>

        {/* Professional Filter Panel */}
        {showFilters && (
          <div className="glass-card p-4 sm:p-6 rounded-2xl border border-slate-100 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <X size={12} />
                  Reset All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Type Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Wallet size={12} />
                  Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as TransactionType | 'ALL')}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all appearance-none cursor-pointer"
                >
                  <option value="ALL">All Types</option>
                  <option value="DEBIT">Money Out</option>
                  <option value="CREDIT">Money In</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Tag size={12} />
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all appearance-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Platform Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Smartphone size={12} />
                  Platform
                </label>
                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all appearance-none cursor-pointer"
                >
                  <option value="All">All Platforms</option>
                  {platforms.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>

              {/* Card Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <CreditCard size={12} />
                  Card
                </label>
                <select
                  value={filterCardNumber}
                  onChange={(e) => setFilterCardNumber(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all appearance-none cursor-pointer"
                >
                  <option value="All">All Cards</option>
                  {cardNumbers.map(card => (
                    <option key={card} value={card}>****{card}</option>
                  ))}
                </select>
              </div>

              {/* Results Count */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Calendar size={12} />
                  Results
                </label>
                <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 flex items-center justify-center">
                  {filteredTransactions.length} {filteredTransactions.length === 1 ? 'payment' : 'payments'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary with Sort Info */}
      {filteredTransactions.length > 0 && (
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <div className="flex items-center gap-3">
            <span>
              Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} payments
            </span>
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md">
              <ArrowUpDown size={10} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                {sortBy === 'date-desc' && 'Latest First'}
                {sortBy === 'date-asc' && 'Oldest First'}
                {sortBy === 'amount-desc' && 'High to Low ₹'}
                {sortBy === 'amount-asc' && 'Low to High ₹'}
                {sortBy === 'merchant-asc' && 'Store A-Z'}
                {sortBy === 'merchant-desc' && 'Store Z-A'}
                {sortBy === 'category-asc' && 'Category A-Z'}
                {sortBy === 'category-desc' && 'Category Z-A'}
              </span>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <X size={12} />
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Mobile Card View - Professional Design */}
      <div className="block md:hidden space-y-3">
        {paginatedTransactions.length > 0 ? (
          paginatedTransactions.map((t) => (
            <div
              key={t.id}
              onClick={() => onTransactionClick?.(t)}
              className="glass-card p-4 rounded-2xl border border-slate-100/50 active:scale-[0.98] transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left Section - Icon & Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <MerchantLogoComponent
                    merchantName={t.merchant}
                    category={t.category}
                    size={48}
                    className="shrink-0 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate mb-1.5 leading-tight">{t.merchant}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-black text-slate-500 uppercase tracking-tighter">{t.category}</span>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-md">
                        <CreditCard size={10} className="text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-500 truncate max-w-[90px]">{t.source}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                      <p className="text-[10px] font-bold text-slate-400">
                        {new Date(t.date).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Right Section - Amount */}
                <div className="flex flex-col items-end shrink-0 gap-1">
                  <p className={`text-lg font-black leading-tight ${t.type === 'DEBIT' ? 'text-slate-800' : 'text-emerald-500'}`}>
                    {t.type === 'DEBIT' ? '-' : '+'}{formatINR(t.amount)}
                  </p>
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <ChevronRight size={12} className="text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-12 rounded-2xl text-center border border-slate-100">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              {hasActiveFilters ? (
                <Filter size={24} className="text-slate-400" />
              ) : (
              <CreditCard size={24} className="text-slate-400" />
              )}
            </div>
            <p className="text-sm font-black text-slate-600 mb-1">
              {hasActiveFilters ? 'No payments match your filters' : 'No Payments Found'}
            </p>
            <p className="text-xs text-slate-400 mb-4">
              {hasActiveFilters ? 'Try adjusting your filters or clear them to see all payments' : 'Start by adding your first payment'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30">
                <th 
                  className="px-6 md:px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-600 transition-colors select-none"
                  onClick={() => setSortBy(sortBy === 'merchant-asc' ? 'merchant-desc' : 'merchant-asc')}
                >
                  <div className="flex items-center gap-1">
                    Store / Activity
                    {sortBy.startsWith('merchant') && (
                      sortBy === 'merchant-asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    )}
                  </div>
                </th>
                <th className="px-6 md:px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Card</th>
                <th 
                  className="px-6 md:px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-600 transition-colors select-none"
                  onClick={() => setSortBy(sortBy === 'date-desc' ? 'date-asc' : 'date-desc')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {sortBy.startsWith('date') && (
                      sortBy === 'date-desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 md:px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right cursor-pointer hover:text-slate-600 transition-colors select-none"
                  onClick={() => setSortBy(sortBy === 'amount-desc' ? 'amount-asc' : 'amount-desc')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    {sortBy.startsWith('amount') && (
                      sortBy === 'amount-desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedTransactions.map((t) => (
                <tr 
                  key={t.id} 
                  onClick={() => onTransactionClick?.(t)}
                  className="hover:bg-slate-50/80 transition-all group cursor-pointer"
                >
                  <td className="px-6 md:px-8 py-5">
                    <div className="flex items-center gap-4">
                      <MerchantLogoComponent
                        merchantName={t.merchant}
                        category={t.category}
                        size={40}
                        className="shrink-0 transition-transform group-hover:scale-110"
                      />
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate">{t.merchant}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{t.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 md:px-8 py-5">
                    <div className="flex items-center gap-2">
                      <CreditCard size={14} className="text-slate-300" />
                      <span className="text-xs font-bold text-slate-500 truncate max-w-[140px]">{t.source}</span>
                    </div>
                  </td>
                  <td className="px-6 md:px-8 py-5 text-xs font-bold text-slate-500">
                    {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </td>
                  <td className={`px-6 md:px-8 py-5 text-sm font-black text-right ${t.type === 'DEBIT' ? 'text-slate-800' : 'text-emerald-500'}`}>
                    <div className="flex items-center justify-end gap-2">
                      <span>{t.type === 'DEBIT' ? '-' : '+'}{formatINR(t.amount)}</span>
                      <ChevronRight size={14} className="text-slate-200 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paginatedTransactions.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              {hasActiveFilters ? (
                <Filter size={24} className="text-slate-400" />
              ) : (
                <CreditCard size={24} className="text-slate-400" />
              )}
            </div>
            <p className="text-sm font-black text-slate-600 mb-1">
              {hasActiveFilters ? 'No payments match your filters' : 'No Payments Found'}
            </p>
            <p className="text-xs text-slate-400 mb-4">
              {hasActiveFilters ? 'Try adjusting your filters or clear them to see all payments' : 'Start by adding your first payment'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Professional Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                currentPage === 1
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:scale-95'
              }`}
            >
              <ChevronLeft size={14} className="inline" />
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                      currentPage === pageNum
                        ? 'bg-[var(--brand-primary)] text-white shadow-lg'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:scale-95'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                currentPage === totalPages
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:scale-95'
              }`}
            >
              <ChevronRightIcon size={14} className="inline" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;

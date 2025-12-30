
import React, { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Transaction, TransactionType } from '../types';
import { formatINR } from '../utils/currency';
import {
  Activity,
  TrendingUp,
  Zap,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ShoppingBag,
  ChevronRight,
  Filter,
  Calendar,
  MoreHorizontal,
  X,
  SlidersHorizontal,
  Tag,
  CreditCard,
  Wallet,
  CalendarDays,
  TrendingDown,
  DollarSign,
  BarChart3
} from 'lucide-react';

interface AnalyticsProps {
  transactions: Transaction[];
  onShowDetails: (t: Transaction) => void;
}

type TimeFrame = '7d' | '30d' | '90d' | 'all' | 'custom';

const Analytics: React.FC<AnalyticsProps> = ({ transactions, onShowDetails }) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('30d');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterCardNumber, setFilterCardNumber] = useState<string>('All');
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

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

  // Get current year and month
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Filter transactions based on timeframe and filters
  const filteredData = useMemo(() => {
    const now = new Date();
    let filtered = transactions;

    // Apply date filter
    filtered = filtered.filter(t => {
      const tDate = new Date(t.date);
      
      if (timeFrame === '7d') {
        return (now.getTime() - tDate.getTime()) <= 7 * 86400000;
      }
      if (timeFrame === '30d') {
        return (now.getTime() - tDate.getTime()) <= 30 * 86400000;
      }
      if (timeFrame === '90d') {
        return (now.getTime() - tDate.getTime()) <= 90 * 86400000;
      }
      if (timeFrame === 'custom' && selectedMonth && selectedYear) {
        const filterDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
        const nextMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0);
        return tDate >= filterDate && tDate <= nextMonth;
      }
      return true;
    });

    // Apply type filter
    if (filterType !== 'ALL') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Apply category filter
    if (filterCategory !== 'All') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    // Apply card filter
    if (filterCardNumber !== 'All') {
      const extractLast4Digits = (source: string): string | null => {
        const match = source.match(/\*{4}(\d{4})(?!\d)|(\d{4})$/);
        return match ? (match[1] || match[2]) : null;
      };
      filtered = filtered.filter(t => {
        const cardNum = extractLast4Digits(t.source);
        return cardNum === filterCardNumber;
      });
    }

    return filtered;
  }, [transactions, timeFrame, filterType, filterCategory, filterCardNumber, selectedMonth, selectedYear]);

  const debits = useMemo(() => filteredData.filter(t => t.type === 'DEBIT'), [filteredData]);
  const credits = useMemo(() => filteredData.filter(t => t.type === 'CREDIT'), [filteredData]);

  const stats = useMemo(() => {
    const totalDebit = debits.reduce((acc, t) => acc + t.amount, 0);
    const totalCredit = credits.reduce((acc, t) => acc + t.amount, 0);
    const daysCount = timeFrame === 'all' ? 30 : timeFrame === 'custom' ? 30 : parseInt(timeFrame) || 30;
    const avgPerDay = totalDebit / daysCount;
    const netFlow = totalCredit - totalDebit;

    // Category mapping
    const catMap: Record<string, number> = {};
    debits.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    const categories = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Store mapping
    const merchantMap: Record<string, { total: number, count: number }> = {};
    debits.forEach(t => {
      if (!merchantMap[t.merchant]) merchantMap[t.merchant] = { total: 0, count: 0 };
      merchantMap[t.merchant].total += t.amount;
      merchantMap[t.merchant].count += 1;
    });
    const topMerchants = Object.entries(merchantMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Timeline mapping (Spending by Day)
    const timelineMap: Record<string, number> = {};
    debits.forEach(t => {
      const d = new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      timelineMap[d] = (timelineMap[d] || 0) + t.amount;
    });
    const timeline = Object.entries(timelineMap)
      .map(([date, amount]) => ({ date, amount }))
      .slice(-10); // Last 10 active days

    return { totalDebit, totalCredit, avgPerDay, categories, topMerchants, timeline, netFlow };
  }, [debits, credits, timeFrame]);

  const drillDownTransactions = useMemo(() => {
    if (!selectedCategory) return debits.slice(0, 5);
    return debits.filter(t => t.category === selectedCategory);
  }, [debits, selectedCategory]);

  const COLORS = ['#4F46E5', '#7C3AED', '#3B82F6', '#6366F1', '#8B5CF6', '#1E1B4B', '#EC4899', '#F59E0B'];

  const hasActiveFilters = filterType !== 'ALL' || filterCategory !== 'All' || filterCardNumber !== 'All' || (timeFrame === 'custom' && (selectedMonth || selectedYear));

  const resetFilters = () => {
    setFilterType('ALL');
    setFilterCategory('All');
    setFilterCardNumber('All');
    setSelectedMonth('');
    setSelectedYear('');
    setTimeFrame('30d');
    setSelectedCategory(null);
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-slide-up pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 leading-tight">Your Spending Insights</h1>
          <p className="text-slate-400 text-xs lg:text-sm font-bold uppercase tracking-widest mt-1">Analytics & Trends</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-sm border transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${
              showFilters || hasActiveFilters
                ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90' 
                : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[8px]">
                {[filterType !== 'ALL' ? 1 : 0, filterCategory !== 'All' ? 1 : 0, filterCardNumber !== 'All' ? 1 : 0, timeFrame === 'custom' ? 1 : 0].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </button>

          {/* Time Frame Selector */}
          <div className="flex bg-white p-1.5 rounded-xl shadow-sm border border-slate-100">
            {(['7d', '30d', '90d', 'all'] as TimeFrame[]).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setTimeFrame(f);
                  if (f !== 'custom') {
                    setSelectedMonth('');
                    setSelectedYear('');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  timeFrame === f 
                    ? 'bg-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)]/20' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {f === 'all' ? 'All Time' : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="glass-card p-6 space-y-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--brand-primary)]/10 rounded-xl flex items-center justify-center">
                <Filter size={18} className="text-[var(--brand-primary)]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Filter Options</h3>
                <p className="text-[10px] text-slate-400 font-bold">Refine your insights</p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-slate-600" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <DollarSign size={12} />
                Type
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['ALL', 'DEBIT', 'CREDIT'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      filterType === type
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type === 'ALL' ? 'All' : type === 'DEBIT' ? 'Money Out' : 'Money In'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Tag size={12} />
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Card Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={12} />
                Card
              </label>
              <select
                value={filterCardNumber}
                onChange={(e) => setFilterCardNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
              >
                <option value="All">All Cards</option>
                {cardNumbers.map((card) => (
                  <option key={card} value={card}>****{card}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CalendarDays size={12} />
              Choose Month
            </label>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  if (e.target.value && selectedYear) {
                    setTimeFrame('custom');
                  }
                }}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
              >
                <option value="">Select Month</option>
                {months.map((month, index) => (
                  <option key={index} value={String(index + 1)}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  if (selectedMonth && e.target.value) {
                    setTimeFrame('custom');
                  }
                }}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
              >
                <option value="">Select Year</option>
                {Array.from({ length: 3 }, (_, i) => currentYear - i).map((year) => (
                  <option key={year} value={String(year)}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
            >
              Reset All Filters
            </button>
          )}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Money Out', 
            val: formatINR(stats.totalDebit), 
            trend: debits.length > 0 ? `${debits.length} payments` : 'No payments',
            icon: ArrowDownRight, 
            color: 'text-rose-500', 
            bg: 'bg-rose-50' 
          },
          { 
            label: 'Money In', 
            val: formatINR(stats.totalCredit), 
            trend: credits.length > 0 ? `${credits.length} payments` : 'No payments',
            icon: ArrowUpRight, 
            color: 'text-emerald-500', 
            bg: 'bg-emerald-50' 
          },
          { 
            label: 'Daily Average', 
            val: formatINR(stats.avgPerDay), 
            trend: timeFrame === 'all' ? 'All time' : `Last ${timeFrame}`,
            icon: Activity, 
            color: 'text-[var(--brand-primary)]', 
            bg: 'bg-[var(--brand-primary)]/10' 
          },
          { 
            label: 'Net Flow', 
            val: formatINR(stats.netFlow), 
            trend: stats.netFlow >= 0 ? 'Positive' : 'Negative',
            icon: stats.netFlow >= 0 ? TrendingUp : TrendingDown, 
            color: stats.netFlow >= 0 ? 'text-emerald-500' : 'text-rose-500', 
            bg: stats.netFlow >= 0 ? 'bg-emerald-50' : 'bg-rose-50' 
          }
        ].map((item, i) => (
          <div key={i} className="glass-card p-5 lg:p-6 space-y-3">
            <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center`}>
              <item.icon size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{item.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-lg lg:text-xl font-black text-slate-900 leading-none">{item.val}</p>
              </div>
              <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{item.trend}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spending Timeline */}
        <div className="lg:col-span-8 glass-card p-6 lg:p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6 lg:mb-10">
            <div>
              <h3 className="text-sm font-black text-[var(--brand-primary)] uppercase tracking-widest">Daily Spending</h3>
              <p className="text-[10px] text-slate-400 font-bold">Your daily spending pattern</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <BarChart3 size={16} strokeWidth={2} />
            </div>
          </div>
          <div className="flex-1 min-h-[240px]">
            {stats.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.timeline}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => formatINR(value)} />
                  <Bar dataKey="amount" fill="var(--brand-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <p className="text-sm font-bold">No spending data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Categories Pie */}
        <div className="lg:col-span-4 glass-card p-6 lg:p-8">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 lg:mb-8">Spending by Category</h3>
          <div className="h-48 relative">
            {stats.categories.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categories}
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      onClick={(data) => setSelectedCategory(data.name)}
                    >
                      {stats.categories.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          className="cursor-pointer hover:opacity-80 transition-opacity" 
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(value: number) => formatINR(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Top Category</p>
                  <p className="text-xs font-black text-slate-900">{stats.categories[0]?.name || 'N/A'}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <p className="text-xs font-bold">No category data</p>
              </div>
            )}
          </div>
          <div className="mt-6 lg:mt-8 space-y-3">
            {stats.categories.slice(0, 3).map((cat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-[10px] font-bold text-slate-600 uppercase">{cat.name}</span>
                </div>
                <span className="text-[10px] font-black text-slate-900">{formatINR(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Stores Leaderboard */}
        <div className="lg:col-span-4 glass-card p-6 lg:p-8">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 lg:mb-8">Top Stores</h3>
          <div className="space-y-6">
            {stats.topMerchants.length > 0 ? (
              stats.topMerchants.map((m, i) => (
                <div key={i} className="group cursor-default">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-black text-[10px] group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {m.name.charAt(0)}
                      </div>
                      <p className="text-xs font-black text-slate-800 truncate">{m.name}</p>
                    </div>
                    <p className="text-xs font-black text-slate-900">{formatINR(m.total)}</p>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(m.total / stats.totalDebit) * 100}%` }}
                    />
                  </div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">{m.count} payments</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p className="text-xs font-bold">No store data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Budget Tracker */}
        <div className="lg:col-span-8 glass-card p-6 lg:p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6 lg:mb-8">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Category Limits</h3>
              <p className="text-[10px] text-slate-400 font-bold">Spending overview by category</p>
            </div>
            <button className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all">
              <Target size={18} strokeWidth={2} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {stats.categories.slice(0, 4).length > 0 ? (
              stats.categories.slice(0, 4).map((cat, i) => {
                const mockBudget = cat.value * 1.25; // Dynamic 25% buffer as "budget"
                const percent = (cat.value / mockBudget) * 100;
                return (
                  <div key={i} className="space-y-4 p-5 rounded-3xl bg-slate-50/50 border border-slate-100/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat.name}</p>
                        <h4 className="text-lg font-black text-slate-900">{formatINR(cat.value)}</h4>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${percent > 90 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {percent > 100 ? 'Exceeded' : 'On Track'}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${percent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      <span>Limit: {formatINR(mockBudget)}</span>
                      <span>{percent.toFixed(0)}% Used</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-8 text-slate-400">
                <p className="text-xs font-bold">No category data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drill-Down Management Section */}
      <div className="glass-card p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 lg:mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
              <Filter size={18} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                {selectedCategory ? `${selectedCategory} Payments` : 'Recent Payments'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Payment details</p>
            </div>
          </div>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-200 hover:border-indigo-400 transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="space-y-4">
          {drillDownTransactions.length > 0 ? (
            drillDownTransactions.map((t, i) => (
              <div
                key={i}
                onClick={() => onShowDetails(t)}
                className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 rounded-2xl group cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm transition-transform group-hover:scale-110">
                    <ShoppingBag size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">{t.merchant}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t.source}</span>
                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                      <span className="text-[8px] font-bold text-slate-400">{new Date(t.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900">-{formatINR(t.amount)}</p>
                    <p className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter">{t.category}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-200 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-bold">No payments found</p>
            </div>
          )}

          <button className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-2">
            <MoreHorizontal size={14} strokeWidth={2} />
            Explore Full History
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

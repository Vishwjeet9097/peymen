
import React, { useState, useEffect } from 'react';
import { X, Save, ShoppingBag, CreditCard, Calendar, Tag, IndianRupee } from 'lucide-react';
import { TransactionType } from '../types';

interface TransactionFormData {
  merchant: string;
  amount: string;
  date: string;
  type: TransactionType;
  category: string;
  source: string;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TransactionFormData) => Promise<void>;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<TransactionFormData>({
    merchant: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'DEBIT',
    category: 'General',
    source: ''
  });

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const firstInput = document.querySelector<HTMLInputElement>('input[name="merchant"]');
        firstInput?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['General', 'Shopping', 'Dining', 'Transport', 'Subscription', 'Health', 'Utilities', 'Travel'];
  const types: TransactionType[] = ['DEBIT', 'CREDIT', 'TRANSFER'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.merchant || !formData.amount) {
      alert("Please fill in Store and Amount");
      return;
    }
    
    try {
      await onSave(formData);
      // Reset form
      setFormData({
        merchant: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: 'DEBIT',
        category: 'General',
        source: ''
      });
    } catch (error) {
      console.error('Failed to save payment:', error);
      alert('Failed to save payment. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Card */}
      <div 
        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-8 sm:p-12">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 id="modal-title" className="text-2xl font-black text-slate-900 tracking-tight uppercase">New Record</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual financial entry</p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Merchant */}
            <div className="space-y-2">
              <label 
                htmlFor="merchant-input"
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"
              >
                <ShoppingBag size={12} className="text-indigo-500" />
                Store Name
              </label>
              <input 
                id="merchant-input"
                name="merchant"
                type="text" 
                placeholder="e.g. Apple Store"
                value={formData.merchant}
                onChange={(e) => setFormData({...formData, merchant: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl h-14 px-6 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 transition-all"
                required
                aria-required="true"
              />
            </div>

            {/* Amount & Date Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label 
                  htmlFor="amount-input"
                  className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"
                >
                  <IndianRupee size={12} className="text-emerald-500" />
                  Amount (₹)
                </label>
                <input 
                  id="amount-input"
                  name="amount"
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl h-14 px-6 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 transition-all"
                  required
                  aria-required="true"
                />
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="date-input"
                  className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"
                >
                  <Calendar size={12} className="text-amber-500" />
                  Date
                </label>
                <input 
                  id="date-input"
                  name="date"
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl h-14 px-6 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 transition-all"
                  required
                  aria-required="true"
                />
              </div>
            </div>

            {/* Type & Category Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label 
                  htmlFor="type-select"
                  className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"
                >
                  <Tag size={12} className="text-sky-500" />
                  Type
                </label>
                <select 
                  id="type-select"
                  name="type"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})}
                  className="w-full bg-slate-50 border-none rounded-2xl h-14 px-6 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                  aria-label="Payment type"
                >
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="category-select"
                  className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"
                >
                  <Tag size={12} className="text-rose-500" />
                  Category
                </label>
                <select 
                  id="category-select"
                  name="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl h-14 px-6 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                  aria-label="Payment category"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Source */}
            <div className="space-y-2">
              <label 
                htmlFor="source-input"
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"
              >
                <CreditCard size={12} className="text-slate-400" />
                Card (Optional)
              </label>
              <input 
                id="source-input"
                name="source"
                type="text" 
                placeholder="e.g. Cash, Chase Card"
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl h-14 px-6 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <button 
              type="submit"
              className="w-full h-16 bg-slate-900 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
              aria-label="Save payment"
            >
              <Save size={18} />
              Save Payment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;

/**
 * Merchant Logo System - Enhanced with Real Logos
 * 
 * Uses actual brand logos from /public/brand_logos/ folder
 * Falls back to colorful initials when logos aren't available
 */

import React from 'react';
import {
  // E-commerce & Shopping
  ShoppingBag,
  ShoppingCart,
  
  // Food & Dining
  Coffee,
  Utensils,
  Pizza,
  
  // Transportation
  Car,
  Plane,
  Train,
  Bike,
  
  // Entertainment & Media
  Film,
  Music,
  Tv,
  
  // Technology & Software
  Smartphone,
  Laptop,
  Monitor,
  
  // Finance & Banking
  CreditCard,
  Banknote,
  TrendingUp,
  
  // Health & Fitness
  Heart,
  
  // Utilities & Services
  Zap,
  Phone,
  
  // Travel & Hotels
  Building2,
  
  // Education & Books
  GraduationCap,
  
  // General & Fallback
  CircleDollarSign
} from 'lucide-react';

// Merchant logo configuration type
export interface MerchantLogo {
  name: string;
  logoPath?: string; // Path to logo in public/brand_logos/
  fallbackIcon: React.ComponentType<any>;
  color: string;
  backgroundColor: string;
  category: string;
}

// Available brand logos in public/brand_logos/ folder
const AVAILABLE_LOGOS: Record<string, string> = {
  'amazon': '/brand_logos/amazon.png',
  'airtel': '/brand_logos/airtel.png',
  'axis': '/brand_logos/axis.png',
  'blinkit': '/brand_logos/blinkit.png',
  'cred': '/brand_logos/creds.png',
  'flipkart': '/brand_logos/flipkart.png',
  'hdfc': '/brand_logos/hdfc.png',
  'icici': '/brand_logos/icici.png',
  'ikea': '/brand_logos/ikea.jpg',
  'ikeaindia': '/brand_logos/ikea.jpg',
  'irctc': '/brand_logos/irctc.png',
  'jio': '/brand_logos/jio.png',
  'meesho': '/brand_logos/messho.png',
  'miniso': '/brand_logos/miniso.png',
  'myntra': '/brand_logos/myntra.png',
  'netflix': '/brand_logos/netflix.png',
  'nykaa': '/brand_logos/nykaa.jpg',
  'reliance': '/brand_logos/Reliance.png',
  'relianceretail': '/brand_logos/Reliance.png',
  'sbi': '/brand_logos/sbi.svg',
  'swiggy': '/brand_logos/swiggy.png',
  'upi': '/brand_logos/upi.png',
  'vi': '/brand_logos/vi.png',
  'zomato': '/brand_logos/zomato.jpg',
  'zepto': '/brand_logos/zepto.png',
  'Zepto': '/brand_logos/zepto.png',
  'v2': '/brand_logos/v2.png',
  'apple': '/brand_logos/apple.png',
  'Apple': '/brand_logos/apple.png',
  'adobe': '/brand_logos/adobe.png',
  'ajio': '/brand_logos/ajio.png',
};

// Color palette for initials fallback
const BRAND_COLORS = [
  { bg: '#FF6B6B', text: '#FFFFFF' }, // Red
  { bg: '#4ECDC4', text: '#FFFFFF' }, // Teal
  { bg: '#45B7D1', text: '#FFFFFF' }, // Blue
  { bg: '#96CEB4', text: '#FFFFFF' }, // Green
  { bg: '#FFEAA7', text: '#2D3436' }, // Yellow
  { bg: '#DDA0DD', text: '#FFFFFF' }, // Plum
  { bg: '#98D8C8', text: '#2D3436' }, // Mint
  { bg: '#F7DC6F', text: '#2D3436' }, // Gold
  { bg: '#BB8FCE', text: '#FFFFFF' }, // Purple
  { bg: '#85C1E9', text: '#FFFFFF' }, // Sky Blue
  { bg: '#F8C471', text: '#2D3436' }, // Orange
  { bg: '#82E0AA', text: '#2D3436' }, // Light Green
];

// Generate consistent color for merchant name
const getColorForMerchant = (merchantName: string): { bg: string; text: string } => {
  const hash = merchantName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return BRAND_COLORS[hash % BRAND_COLORS.length];
};

// Generate initials from merchant name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

// Comprehensive merchant database
export const MERCHANT_LOGOS: Record<string, MerchantLogo> = {
  // E-commerce Giants
  'amazon': {
    name: 'Amazon',
    logoPath: AVAILABLE_LOGOS.amazon,
    fallbackIcon: ShoppingBag,
    color: '#FF9900',
    backgroundColor: '#232F3E',
    category: 'Shopping'
  },
  'flipkart': {
    name: 'Flipkart',
    logoPath: AVAILABLE_LOGOS.flipkart,
    fallbackIcon: ShoppingCart,
    color: '#2074F7',
    backgroundColor: '#ffffff',
    category: 'Shopping'
  },
  'myntra': {
    name: 'Myntra',
    logoPath: AVAILABLE_LOGOS.myntra,
    fallbackIcon: ShoppingBag,
    color: '#FF3F6C',
    backgroundColor: '#ffffff',
    category: 'Shopping'
  },
  'ajio': {
    name: 'AJIO',
    logoPath: AVAILABLE_LOGOS.ajio,
    fallbackIcon: ShoppingBag,
    color: '#000000',
    backgroundColor: '#ffffff',
    category: 'Shopping'
  },

  // Quick Commerce & Groceries
  'zepto': {
    name: 'Zepto',
    logoPath: AVAILABLE_LOGOS.zepto,
    fallbackIcon: ShoppingCart,
    color: '#FF4500',
    backgroundColor: '#ffffff',
    category: 'Groceries'
  },
  'blinkit': {
    name: 'Blinkit',
    logoPath: AVAILABLE_LOGOS.blinkit,
    fallbackIcon: ShoppingCart,
    color: '#FFD700',
    backgroundColor: '#000000',
    category: 'Groceries'
  },
  'bigbasket': {
    name: 'BigBasket',
    fallbackIcon: ShoppingCart,
    color: '#84C225',
    backgroundColor: '#ffffff',
    category: 'Groceries'
  },

  // Beauty & Personal Care
  'nykaa': {
    name: 'Nykaa',
    logoPath: AVAILABLE_LOGOS.nykaa,
    fallbackIcon: ShoppingBag,
    color: '#FF1993',
    backgroundColor: '#ffffff',
    category: 'Beauty'
  },
  'beminimalist': {
    name: 'Be Minimalist',
    fallbackIcon: ShoppingBag,
    color: '#000000',
    backgroundColor: '#ffffff',
    category: 'Beauty'
  },

  // Fashion & Lifestyle
  'meesho': {
    name: 'Meesho',
    logoPath: AVAILABLE_LOGOS.meesho,
    fallbackIcon: ShoppingBag,
    color: '#A426A6',
    backgroundColor: '#ffffff',
    category: 'Shopping'
  },
  'lifestyleinternational': {
    name: 'Lifestyle International',
    fallbackIcon: ShoppingBag,
    color: '#ED142D',
    backgroundColor: '#ffffff',
    category: 'Shopping'
  },
  'miniso': {
    name: 'Miniso',
    logoPath: AVAILABLE_LOGOS.miniso,
    fallbackIcon: ShoppingBag,
    color: '#ED142D',
    backgroundColor: '#ffffff',
    category: 'Shopping'
  },
  'relianceretail': {
    name: 'Reliance Retail',
    logoPath: AVAILABLE_LOGOS.relianceretail,
    fallbackIcon: ShoppingBag,
    color: '#0040A0',
    backgroundColor: '#ffffff',
    category: 'Shopping'
  },
  'ikeaindia': {
    name: 'IKEA India',
    logoPath: AVAILABLE_LOGOS.ikeaindia,
    fallbackIcon: ShoppingBag,
    color: '#0051A5',
    backgroundColor: '#FFDB00',
    category: 'Shopping'
  },
  'naseemperfumes': {
    name: 'Naseem Perfumes',
    fallbackIcon: ShoppingBag,
    color: '#842583',
    backgroundColor: '#ffffff',
    category: 'Beauty'
  },

  // Food & Dining
  'zomato': {
    name: 'Zomato',
    logoPath: AVAILABLE_LOGOS.zomato,
    fallbackIcon: Utensils,
    color: '#E23744',
    backgroundColor: '#ffffff',
    category: 'Dining'
  },
  'swiggy': {
    name: 'Swiggy',
    logoPath: AVAILABLE_LOGOS.swiggy,
    fallbackIcon: Utensils,
    color: '#FC8C0C',
    backgroundColor: '#ffffff',
    category: 'Dining'
  },
  'dominos': {
    name: 'Dominos',
    fallbackIcon: Pizza,
    color: '#0066A0',
    backgroundColor: '#ffffff',
    category: 'Dining'
  },
  'starbucks': {
    name: 'Starbucks',
    fallbackIcon: Coffee,
    color: '#00704A',
    backgroundColor: '#ffffff',
    category: 'Dining'
  },
  'mcdonalds': {
    name: 'McDonalds',
    fallbackIcon: Utensils,
    color: '#FFC12C',
    backgroundColor: '#DA001B',
    category: 'Dining'
  },

  // Transportation
  'uber': {
    name: 'Uber',
    fallbackIcon: Car,
    color: '#000000',
    backgroundColor: '#ffffff',
    category: 'Transport'
  },
  'ola': {
    name: 'Ola',
    fallbackIcon: Car,
    color: '#00C751',
    backgroundColor: '#ffffff',
    category: 'Transport'
  },
  'rapido': {
    name: 'Rapido',
    fallbackIcon: Bike,
    color: '#FFD700',
    backgroundColor: '#000000',
    category: 'Transport'
  },

  // Entertainment & Streaming
  'netflix': {
    name: 'Netflix',
    logoPath: AVAILABLE_LOGOS.netflix,
    fallbackIcon: Film,
    color: '#E30B17',
    backgroundColor: '#ffffff',
    category: 'Entertainment'
  },
  'spotify': {
    name: 'Spotify',
    fallbackIcon: Music,
    color: '#1DB954',
    backgroundColor: '#ffffff',
    category: 'Entertainment'
  },
  'youtube': {
    name: 'YouTube',
    fallbackIcon: Tv,
    color: '#FF0000',
    backgroundColor: '#ffffff',
    category: 'Entertainment'
  },
  'hotstar': {
    name: 'Hotstar',
    fallbackIcon: Film,
    color: '#0F1419',
    backgroundColor: '#0094FF',
    category: 'Entertainment'
  },

  // Technology & Software
  'google': {
    name: 'Google',
    fallbackIcon: Smartphone,
    color: '#4285F4',
    backgroundColor: '#ffffff',
    category: 'Technology'
  },
  'apple': {
    name: 'Apple',
    logoPath: AVAILABLE_LOGOS.apple,
    fallbackIcon: Smartphone,
    color: '#000000',
    backgroundColor: '#ffffff',
    category: 'Technology'
  },
  'microsoft': {
    name: 'Microsoft',
    fallbackIcon: Laptop,
    color: '#0078D4',
    backgroundColor: '#ffffff',
    category: 'Technology'
  },
  'adobe': {
    name: 'Adobe',
    logoPath: AVAILABLE_LOGOS.adobe,
    fallbackIcon: Monitor,
    color: '#FF0000',
    backgroundColor: '#ffffff',
    category: 'Technology'
  },

  // Utilities & Services
  'airtel': {
    name: 'Airtel',
    logoPath: AVAILABLE_LOGOS.airtel,
    fallbackIcon: Phone,
    color: '#ED142D',
    backgroundColor: '#ffffff',
    category: 'Utilities'
  },
  'jio': {
    name: 'Jio',
    logoPath: AVAILABLE_LOGOS.jio,
    fallbackIcon: Phone,
    color: '#0040A0',
    backgroundColor: '#ffffff',
    category: 'Utilities'
  },
  'vi': {
    name: 'Vi',
    logoPath: AVAILABLE_LOGOS.vi,
    fallbackIcon: Phone,
    color: '#660099',
    backgroundColor: '#ffffff',
    category: 'Utilities'
  },
  'vodafone': {
    name: 'Vodafone',
    fallbackIcon: Phone,
    color: '#E60E2E',
    backgroundColor: '#ffffff',
    category: 'Utilities'
  },

  // Travel & Transportation
  'irctc': {
    name: 'IRCTC',
    logoPath: AVAILABLE_LOGOS.irctc,
    fallbackIcon: Train,
    color: '#0040A0',
    backgroundColor: '#ffffff',
    category: 'Travel'
  },
  'makemytrip': {
    name: 'MakeMyTrip',
    fallbackIcon: Plane,
    color: '#ED142D',
    backgroundColor: '#ffffff',
    category: 'Travel'
  },
  'oyo': {
    name: 'OYO',
    fallbackIcon: Building2,
    color: '#EE2737',
    backgroundColor: '#ffffff',
    category: 'Travel'
  },

  // Financial Services & Fintech
  'paytm': {
    name: 'Paytm',
    fallbackIcon: CreditCard,
    color: '#00BAF2',
    backgroundColor: '#ffffff',
    category: 'Finance'
  },
  'phonepe': {
    name: 'PhonePe',
    fallbackIcon: CreditCard,
    color: '#5F259F',
    backgroundColor: '#ffffff',
    category: 'Finance'
  },
  'googlepay': {
    name: 'Google Pay',
    fallbackIcon: CreditCard,
    color: '#4CAF50',
    backgroundColor: '#ffffff',
    category: 'Finance'
  },
  'cred': {
    name: 'CRED',
    logoPath: AVAILABLE_LOGOS.cred,
    fallbackIcon: CreditCard,
    color: '#000000',
    backgroundColor: '#ffffff',
    category: 'Finance'
  },

  // Health & Fitness
  'practo': {
    name: 'Practo',
    fallbackIcon: Heart,
    color: '#33C75A',
    backgroundColor: '#ffffff',
    category: 'Health'
  },
  'apollo': {
    name: 'Apollo',
    fallbackIcon: Heart,
    color: '#0079BF',
    backgroundColor: '#ffffff',
    category: 'Health'
  },

  // Banking
  'hdfc': {
    name: 'HDFC Bank',
    logoPath: AVAILABLE_LOGOS.hdfc,
    fallbackIcon: CreditCard,
    color: '#004C8F',
    backgroundColor: '#ffffff',
    category: 'Finance'
  },
  'icici': {
    name: 'ICICI Bank',
    logoPath: AVAILABLE_LOGOS.icici,
    fallbackIcon: CreditCard,
    color: '#F37021',
    backgroundColor: '#ffffff',
    category: 'Finance'
  },
  'sbi': {
    name: 'SBI',
    logoPath: AVAILABLE_LOGOS.sbi,
    fallbackIcon: CreditCard,
    color: '#1F4E79',
    backgroundColor: '#ffffff',
    category: 'Finance'
  },
  'axis': {
    name: 'Axis Bank',
    logoPath: AVAILABLE_LOGOS.axis,
    fallbackIcon: CreditCard,
    color: '#800080',
    backgroundColor: '#ffffff',
    category: 'Finance'
  }
};

// Merchant detection patterns
export const MERCHANT_PATTERNS: Record<string, RegExp[]> = {
  // E-commerce
  'amazon': [/amazon/i, /amzn/i, /amazon\.in/i, /amazon pay/i],
  'flipkart': [/flipkart/i, /fkrt/i, /flipkart\.com/i],
  'myntra': [/myntra/i, /myntra\.com/i, /myntradesignspvtltd/i],
  'ajio': [/ajio/i, /ajio\.com/i],
  
  // Quick Commerce & Groceries
  'zepto': [/zepto/i, /zepto\.com/i],
  'blinkit': [/blinkit/i, /grofers/i, /blinkit\.com/i],
  'bigbasket': [/bigbasket/i, /big basket/i, /bigbasket\.com/i],
  
  // Beauty & Personal Care
  'nykaa': [/nykaa/i, /nykaa\.com/i],
  'beminimalist': [/beminimalist/i, /be minimalist/i, /minimalist/i],
  
  // Fashion & Lifestyle
  'meesho': [/meesho/i, /meesho\.com/i],
  'lifestyleinternational': [/lifestyleinternation/i, /lifestyle international/i, /lifestyle/i],
  'miniso': [/miniso/i, /miniso\.com/i],
  'relianceretail': [/reliance retail/i, /reliance/i, /relianceretail/i],
  'ikeaindia': [/ikeaindiapvtltd/i, /ikea india/i, /ikea/i],
  'naseemperfumes': [/naseemperfumesllp/i, /naseem perfumes/i, /naseem/i],
  
  // Food & Dining
  'zomato': [/zomato/i, /zomato\.com/i],
  'swiggy': [/swiggy/i, /swiggy\.in/i],
  'dominos': [/dominos/i, /domino's/i, /domino pizza/i],
  'starbucks': [/starbucks/i, /sbux/i],
  'mcdonalds': [/mcdonalds/i, /mcdonald's/i, /mcd/i],
  
  // Transportation
  'uber': [/uber/i, /uber\.com/i, /uber india/i],
  'ola': [/ola/i, /ola cabs/i, /olacabs/i],
  'rapido': [/rapido/i, /rapido bike/i],
  
  // Entertainment
  'netflix': [/netflix/i, /nflx/i],
  'spotify': [/spotify/i, /spotify premium/i],
  'youtube': [/youtube/i, /youtube premium/i, /yt premium/i],
  'hotstar': [/hotstar/i, /disney hotstar/i, /disney\+/i],
  
  // Technology
  'google': [/google/i, /google play/i, /google store/i, /google cloud/i],
  'apple': [/apple/i, /app store/i, /itunes/i, /icloud/i],
  'microsoft': [/microsoft/i, /msft/i, /office 365/i, /xbox/i],
  'adobe': [/adobe/i, /creative cloud/i, /photoshop/i, /adobesystemssoftware/i],
  
  // Financial Services & Fintech
  'paytm': [/paytm/i, /paytm wallet/i],
  'phonepe': [/phonepe/i, /phone pe/i],
  'googlepay': [/google pay/i, /gpay/i, /g pay/i],
  'cred': [/cred/i, /cred\.club/i],
  
  // Utilities & Telecom
  'airtel': [/airtel/i, /bharti airtel/i],
  'jio': [/jio/i, /reliance jio/i, /jiosaavn/i],
  'vi': [/vi/i, /vodafone idea/i, /idea/i],
  'vodafone': [/vodafone/i, /idea/i],
  
  // Travel & Transportation
  'irctc': [/irctc/i, /billdesk\*indian railwa/i, /indian railwa/i, /billdesk indian railwa/i, /billdesk\*indian railway/i, /indian railway/i, /billdesk indian railway/i],
  'makemytrip': [/makemytrip/i, /mmt/i, /make my trip/i],
  'oyo': [/oyo/i, /oyo rooms/i, /oyo hotels/i],
  
  // Health
  'practo': [/practo/i, /practo\.com/i],
  'apollo': [/apollo/i, /apollo pharmacy/i, /apollo hospital/i],
  
  // Banking
  'hdfc': [/hdfc/i, /hdfc bank/i],
  'icici': [/icici/i, /icici bank/i],
  'sbi': [/sbi/i, /state bank/i, /state bank of india/i],
  'axis': [/axis/i, /axis bank/i]
};

// Get merchant logo by merchant name
export const getMerchantLogo = (merchantName: string): MerchantLogo | null => {
  const merchantLower = merchantName.toLowerCase();
  
  // Direct match first
  if (MERCHANT_LOGOS[merchantLower]) {
    return MERCHANT_LOGOS[merchantLower];
  }
  
  // Pattern matching
  for (const [key, patterns] of Object.entries(MERCHANT_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(merchantName))) {
      return MERCHANT_LOGOS[key];
    }
  }
  
  return null;
};

// Get fallback icon based on category
export const getCategoryFallbackIcon = (category: string): React.ComponentType<any> => {
  const categoryLower = category.toLowerCase();
  
  switch (categoryLower) {
    case 'shopping':
    case 'groceries':
      return ShoppingBag;
    case 'dining':
    case 'food':
      return Utensils;
    case 'transport':
    case 'travel':
      return Car;
    case 'entertainment':
    case 'subscription':
      return Film;
    case 'utilities':
      return Zap;
    case 'health':
      return Heart;
    case 'education':
      return GraduationCap;
    case 'finance':
    case 'income':
      return TrendingUp;
    case 'transfer':
      return Banknote;
    default:
      return CircleDollarSign;
  }
};

// Generate merchant logo component with real logos and colorful initials fallback
export const MerchantLogoComponent: React.FC<{
  merchantName: string;
  category: string;
  size?: number;
  className?: string;
}> = ({ merchantName, category, size = 40, className = '' }) => {
  const merchantLogo = getMerchantLogo(merchantName);
  
  if (merchantLogo?.logoPath) {
    // Use real logo from public/brand_logos/
    return React.createElement('div', {
      className: `rounded-xl flex items-center justify-center overflow-hidden ${className}`,
      style: { 
        width: size, 
        height: size,
        backgroundColor: merchantLogo.backgroundColor 
      }
    }, React.createElement('img', {
      src: merchantLogo.logoPath,
      alt: merchantLogo.name,
      width: size,
      height: size,
      className: "object-contain w-full h-full",
      style: { maxWidth: '100%', maxHeight: '100%' }
    }));
  }
  
  if (merchantLogo) {
    // Use colorful initials for known merchants without logos
    const initials = getInitials(merchantLogo.name);
    const colors = getColorForMerchant(merchantLogo.name);
    
    return React.createElement('div', {
      className: `rounded-xl flex items-center justify-center font-semibold ${className}`,
      style: { 
        width: size, 
        height: size,
        backgroundColor: colors.bg,
        color: colors.text,
        fontSize: size * 0.4
      }
    }, initials);
  }
  
  // Fallback to colorful initials for unknown merchants
  const initials = getInitials(merchantName);
  const colors = getColorForMerchant(merchantName);
  
  return React.createElement('div', {
    className: `rounded-xl flex items-center justify-center font-semibold ${className}`,
    style: { 
      width: size, 
      height: size,
      backgroundColor: colors.bg,
      color: colors.text,
      fontSize: size * 0.4
    }
  }, initials);
};

export default MerchantLogoComponent;
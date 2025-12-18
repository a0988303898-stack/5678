
import React from 'react';
import { 
  Utensils, Car, ShoppingBag, Home, HeartPulse, GraduationCap, 
  Wallet, TrendingUp, Gift, Briefcase 
} from 'lucide-react';

export const DEFAULT_CATEGORIES = [
  { id: '1', name: '飲食', type: 'expense', icon: 'Utensils' },
  { id: '2', name: '交通', type: 'expense', icon: 'Car' },
  { id: '3', name: '購物', type: 'expense', icon: 'ShoppingBag' },
  { id: '4', name: '房租', type: 'expense', icon: 'Home' },
  { id: '5', name: '醫療', type: 'expense', icon: 'HeartPulse' },
  { id: '6', name: '教育', type: 'expense', icon: 'GraduationCap' },
  { id: '7', name: '薪資', type: 'income', icon: 'Briefcase' },
  { id: '8', name: '投資回報', type: 'income', icon: 'TrendingUp' },
  { id: '9', name: '獎金', type: 'income', icon: 'Gift' },
  { id: '10', name: '其他收入', type: 'income', icon: 'Wallet' },
];

export const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Utensils': return <Utensils className="w-4 h-4" />;
    case 'Car': return <Car className="w-4 h-4" />;
    case 'ShoppingBag': return <ShoppingBag className="w-4 h-4" />;
    case 'Home': return <Home className="w-4 h-4" />;
    case 'HeartPulse': return <HeartPulse className="w-4 h-4" />;
    case 'GraduationCap': return <GraduationCap className="w-4 h-4" />;
    case 'Briefcase': return <Briefcase className="w-4 h-4" />;
    case 'TrendingUp': return <TrendingUp className="w-4 h-4" />;
    case 'Gift': return <Gift className="w-4 h-4" />;
    default: return <Wallet className="w-4 h-4" />;
  }
};

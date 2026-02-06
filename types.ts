import type { ReactElement } from 'react';

export interface IconProps {
    className?: string;
}

export interface Jar {
  id: 'NEC' | 'FFA' | 'LTS' | 'EDU' | 'PLAY' | 'GIVE';
  name: string;
  percentage: number;
  description: string;
  color: string;
  icon: ReactElement<IconProps>;
}

export interface AllocatedJar extends Jar {
  amount: number; // Cumulative amount
  amountAddedThisMonth: number;
  amountSpentThisMonth: number;
}

export interface Expense {
    id: string;
    jarId: Jar['id'];
    amount: number;
    description:string;
}

export interface Income {
    id: string;
    amount: number;
    description: string;
}

export interface MonthlyRecord {
    month: string; // Format: "YYYY-MM"
    incomes: Income[];
    jars: Jar[];
    expenses: Expense[];
}
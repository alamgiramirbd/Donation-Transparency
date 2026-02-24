export interface Category {
  id: number;
  name: string;
}

export interface Project {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  description: string;
}

export interface Income {
  id: number;
  receipt_number: string;
  amount: number;
  project_id: number;
  project_name?: string;
  donor_name?: string;
  date: string;
  notes: string;
}

export interface Expense {
  id: number;
  amount: number;
  project_id: number;
  project_name?: string;
  description: string;
  date: string;
}

export interface Stats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  projects: {
    id: number;
    name: string;
    income: number;
    expense: number;
  }[];
}

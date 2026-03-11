// Tipos globais do Empreendii Soluções ScoreMaster

export interface Profile {
  name?: string;
  company_name?: string;
  identifier?: string;
  cpf?: string;
  cnpj?: string;
  score: number;
  scoreTrend: 'up' | 'down' | 'stable';
  debts: Debt[];
  birth_date?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_cep?: string;
}

export interface Debt {
  creditor: string;
  amount: number;
  date?: string;
  status?: string;
}

export interface FinancialItem {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  payment_link?: string;
  paid_at?: string;
}

export interface CreditHealth {
  score: number;
  level: string;
  level_color: string;
  percentage: number;
  last_calculated: string | null;
  initial_data: {
    has_positive_score?: boolean;
    bank_accounts_range?: string;
    has_auto_debit?: boolean;
    has_investments?: boolean;
    has_insurance?: boolean;
  };
  breakdown?: {
    score_positivo?: number;
    contas_bancarias?: number;
    debitos_automaticos?: number;
    investimentos?: number;
    seguros?: number;
  };
}

export interface TaskProgress {
  done: boolean;
  timestamp: number;
  checklist_items?: Record<string, boolean>;
  reset_note?: string;
  reset_at?: string;
}

export interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  uploadedAt: string;
  size: number;
}

export interface UserTask {
  id: string;
  title: string;
  description: string;
  type: 'action' | 'checklist' | 'link';
  items?: string[];
  link_url?: string;
  link_label?: string;
  created_at: string;
  created_by: string;
  done?: boolean;
  done_at?: string;
}

export interface User {
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  isAdmin?: boolean;
  onboarding_completed: boolean;
  credit_health_completed?: boolean;
  raio_x_status: 'pending' | 'pending_approval' | 'approved' | 'rejected';
  pending_xray_purchase?: boolean;
  profiles: {
    PF?: Profile;
    PJ?: Profile;
  };
  financial_items: FinancialItem[];
  badges: string[];
  progress: Record<string, TaskProgress>;
  credit_health: CreditHealth;
  total_points: number;
  streak_days: number;
  last_activity: string | null;
  occupation?: string;
  mother_name?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_cep?: string;
  doc_uploaded?: boolean;
  consultation_file?: string;
  uploads?: Record<string, UploadedFile>;
  user_tasks?: UserTask[];
  _impersonated_by?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'action' | 'checklist' | 'form' | 'video_action' | 'upload' | 'health_quiz';
  mandatory: boolean;
  video_url?: string;
  content_url?: string;
  actions?: string[];
  items?: string[];
}

export interface Stage {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  locked: boolean;
  is_paid?: boolean;
  price?: number;
  payment_link?: string;
  tasks: Task[];
}

export interface GlobalSettings {
  whatsapp_number: string;
  mentoria_link: string;
  cartao_garantido_link: string;
}

export interface Content {
  stages: Stage[];
  settings?: GlobalSettings;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  stage_required?: string;
  task_count?: number;
  streak_days?: number;
  points: number;
}

export interface BadgesData {
  badges: Badge[];
  progress_messages: Record<string, string>;
}

export interface CreditCard {
  id: string;
  title: string;
  category: 'guaranteed' | 'education' | 'standard';
  description: string;
  client_description: string;
  type: 'standard' | 'exclusive';
  allowed_users: string[];
  allowed_values?: number[];
  price?: number;
  payment_rule: {
    type: 'percent' | 'fixed';
    value?: number;
    installments?: number[];
  };
}

export interface ServicesData {
  raio_x: { price: number; payment_link: string };
  credit_cards: CreditCard[];
}

export type ProfileType = 'PF' | 'PJ';

export interface RatingInfo {
  rating: string;
  label: string;
  color: string;
  description: string;
  score_range: [number, number];
}

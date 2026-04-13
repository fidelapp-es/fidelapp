export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  qr_code: string
  points: number
  total_spent: number
  visits_count?: number
  cashback_balance?: number
  created_at: string
}

export interface Visit {
  id: string
  customer_id: string
  amount_spent: number
  points_earned: number
  notes: string | null
  created_at: string
  customers?: Customer
}

export interface Promotion {
  id: string
  title: string
  description: string
  points_required: number
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  active: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  price: number
  category: string
  active: boolean
  created_at: string
}

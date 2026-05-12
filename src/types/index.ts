// User types
export interface User {
  id: string
  email: string
  fullName: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

// School/Organization types
export interface School {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  createdAt: string
  updatedAt: string
}

// Contract types
export interface Contract {
  id: string
  title: string
  description?: string
  schoolId: string
  createdBy: string
  status: 'draft' | 'pending' | 'approved' | 'signed' | 'archived'
  content: string
  createdAt: string
  updatedAt: string
  signedAt?: string
}

// Contract signature types
export interface ContractSignature {
  id: string
  contractId: string
  signedBy: string
  signature: string // Base64 encoded
  signedAt: string
  createdAt: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiListResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
  error?: string
}

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface SignUpFormData {
  email: string
  password: string
  passwordConfirm: string
  fullName: string
}

export interface CreateContractFormData {
  title: string
  description: string
  content: string
}

// Dashboard types
export interface DashboardStats {
  totalContracts: number
  pendingContracts: number
  signedContracts: number
  thisMonthContracts: number
}

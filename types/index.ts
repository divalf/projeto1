export type Role = "admin" | "gestor" | "vendedor";

export type OpportunityStatus = "open" | "won" | "lost" | "archived";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: Role;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  title: string;
  value: number | null;
  currency: string;
  customer_id: string | null;
  stage_id: string;
  owner_id: string;
  status: OpportunityStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  archived_at: string | null;
  // Joins opcionais
  customer?: Customer;
  stage?: PipelineStage;
  owner?: Profile;
}

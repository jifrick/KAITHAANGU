export type UserRole = 'admin' | 'donor' | 'recipient' | 'both';
export type AccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type AdminType = 'super_admin' | 'verification_admin' | 'content_admin' | 'matching_admin' | 'support_moderator';

export interface Profile {
  id: string;
  role: UserRole;
  admin_role: AdminType | null;
  name: string | null;
  phone: string | null;
  address: string | null;
  profile_completed: boolean;
  account_status: AccountStatus;
  created_at: string;
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface RecipientVerification {
  user_id: string;
  status: VerificationStatus;
  applicant_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
}

export type ItemStatus = 'draft' | 'pending_moderation' | 'published' | 'reserved' | 'matched' | 'completed' | 'removed';

export interface Item {
  id: string;
  donor_id: string;
  title: string;
  category: string;
  description: string;
  condition: string;
  area: string | null;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
}

export interface ItemImage {
  id: string;
  item_id: string;
  storage_path: string;
  variant: string;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  created_at: string;
}

export interface Consent {
  id: string;
  user_id: string;
  consent_type: string;
  consent_version: string;
  item_id: string | null;
  accepted_at: string;
}

-- KAITHAANGU Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Create Custom Types (Enums)
CREATE TYPE user_role AS ENUM ('admin', 'donor', 'recipient');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE item_status AS ENUM ('draft', 'pending_moderation', 'published', 'reserved', 'matched', 'completed', 'removed');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE match_status AS ENUM ('pending_consent', 'confirmed', 'handed_over', 'completed', 'cancelled');

-- 2. Create Tables

-- PROFILES
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'donor',
  name text,
  phone text,
  address text,
  profile_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RECIPIENT VERIFICATIONS
CREATE TABLE public.recipient_verifications (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  status verification_status DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  admin_notes text
);

-- ITEMS
CREATE TABLE public.items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  condition text NOT NULL,
  area text,
  status item_status DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ITEM IMAGES
CREATE TABLE public.item_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  variant text NOT NULL,
  width integer,
  height integer,
  size_bytes bigint,
  created_at timestamptz DEFAULT now()
);

-- ITEM REQUESTS
CREATE TABLE public.item_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status request_status DEFAULT 'pending',
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_id, recipient_id) -- Prevent duplicate requests
);

-- MATCHES
CREATE TABLE public.matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  donor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status match_status DEFAULT 'pending_consent',
  consent_fields jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_id) -- One match per item
);

-- REPORTS
CREATE TABLE public.reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL, -- 'user' or 'item'
  target_id uuid NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- 3. Setup Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipient_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles RLS
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.is_admin());

CREATE POLICY "Public can view limited donor info" ON public.profiles
  FOR SELECT USING (role = 'donor'); -- Adjust later if needed to hide phone/address

-- Items RLS
CREATE POLICY "Anyone can view published items" ON public.items
  FOR SELECT USING (status = 'published');

CREATE POLICY "Donors can manage their own items" ON public.items
  FOR ALL USING (auth.uid() = donor_id);

CREATE POLICY "Admins can manage all items" ON public.items
  FOR ALL USING (public.is_admin());

-- Item Images RLS
CREATE POLICY "Anyone can view item images" ON public.item_images
  FOR SELECT USING (true);

CREATE POLICY "Donors can manage images for their items" ON public.item_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = item_images.item_id AND items.donor_id = auth.uid()
    )
  );

-- Requests RLS
CREATE POLICY "Recipients can view their own requests" ON public.item_requests
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Recipients can create requests" ON public.item_requests
  FOR INSERT WITH CHECK (
    auth.uid() = recipient_id AND
    EXISTS (
      SELECT 1 FROM public.recipient_verifications
      WHERE user_id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Admins can manage all requests" ON public.item_requests
  FOR ALL USING (public.is_admin());

CREATE POLICY "Donors can view requests for their items" ON public.item_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = item_requests.item_id AND items.donor_id = auth.uid()
    )
  );

-- Matches RLS
CREATE POLICY "Participants can view their matches" ON public.matches
  FOR SELECT USING (auth.uid() = donor_id OR auth.uid() = recipient_id);

CREATE POLICY "Admins can manage all matches" ON public.matches
  FOR ALL USING (public.is_admin());

-- Setup Triggers (e.g. automatically creating profile on signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'donor');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Setup Supabase Storage Bucket for Images (this needs to be executed separately or via dashboard)
-- insert into storage.buckets (id, name, public) values ('items', 'items', true);

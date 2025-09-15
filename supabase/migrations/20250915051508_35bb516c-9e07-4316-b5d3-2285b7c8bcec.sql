-- Add missing columns to documents table for AI analysis results
ALTER TABLE public.documents 
ADD COLUMN key_points JSONB,
ADD COLUMN legal_terms JSONB,
ADD COLUMN warnings JSONB;
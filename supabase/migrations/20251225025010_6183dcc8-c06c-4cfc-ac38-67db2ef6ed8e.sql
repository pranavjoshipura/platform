-- Create table for storing demo run history
CREATE TABLE public.demo_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demo_id TEXT NOT NULL,
  demo_title TEXT NOT NULL,
  input_payload JSONB NOT NULL,
  output_data JSONB NOT NULL,
  execution_mode TEXT NOT NULL DEFAULT 'cloud',
  model_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_runs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view demo runs (no auth required for this demo app)
CREATE POLICY "Anyone can view demo runs" 
ON public.demo_runs 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to insert demo runs
CREATE POLICY "Anyone can insert demo runs" 
ON public.demo_runs 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster lookups by demo_id
CREATE INDEX idx_demo_runs_demo_id ON public.demo_runs(demo_id);
CREATE INDEX idx_demo_runs_created_at ON public.demo_runs(created_at DESC);
-- Create sync queue table to manage background activity syncing
CREATE TABLE IF NOT EXISTS public.sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  runner_id UUID NOT NULL REFERENCES public.runners(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_activities_estimate INTEGER,
  activities_synced INTEGER DEFAULT 0,
  oldest_synced_date TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 5,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_sync_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(runner_id)
);

-- Enable RLS
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

-- Only admins can manage sync queue
CREATE POLICY "Admins can manage sync queue"
  ON public.sync_queue
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient querying
CREATE INDEX idx_sync_queue_status_priority ON public.sync_queue(status, priority DESC, next_sync_at);
CREATE INDEX idx_sync_queue_runner ON public.sync_queue(runner_id);

-- Update trigger
CREATE TRIGGER update_sync_queue_updated_at
  BEFORE UPDATE ON public.sync_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
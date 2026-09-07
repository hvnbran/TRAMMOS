CREATE TABLE public.conductor_push_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  plataforma text NOT NULL DEFAULT 'android',
  device_model text,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conductor_push_tokens TO authenticated;
GRANT ALL ON public.conductor_push_tokens TO service_role;

ALTER TABLE public.conductor_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_tokens_select" ON public.conductor_push_tokens
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "own_tokens_insert" ON public.conductor_push_tokens
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own_tokens_update" ON public.conductor_push_tokens
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "own_tokens_delete" ON public.conductor_push_tokens
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_conductor_push_tokens_updated_at
  BEFORE UPDATE ON public.conductor_push_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_conductor_push_tokens_user ON public.conductor_push_tokens(user_id);

ALTER TABLE public.push_notifications_queue
  ADD COLUMN IF NOT EXISTS fcm_status text,
  ADD COLUMN IF NOT EXISTS fcm_sent_at timestamp with time zone;
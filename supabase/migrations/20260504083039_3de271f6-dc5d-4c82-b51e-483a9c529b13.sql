-- TRAMI: memoria contextual persistente
CREATE TABLE public.trami_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trami_conv_user ON public.trami_conversations(user_id, last_message_at DESC);

ALTER TABLE public.trami_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select_own_trami_conv" ON public.trami_conversations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_insert_own_trami_conv" ON public.trami_conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_update_own_trami_conv" ON public.trami_conversations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_delete_own_trami_conv" ON public.trami_conversations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.trami_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.trami_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','tool','system')),
  content text NOT NULL DEFAULT '',
  tool_name text,
  tool_payload jsonb,
  context_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trami_msg_conv ON public.trami_messages(conversation_id, created_at);

ALTER TABLE public.trami_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select_own_trami_msg" ON public.trami_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_insert_own_trami_msg" ON public.trami_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_delete_own_trami_msg" ON public.trami_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_trami_conversations_updated_at
BEFORE UPDATE ON public.trami_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
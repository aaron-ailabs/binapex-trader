-- Create a unified audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  payload JSONB,
  old_payload JSONB,
  metadata JSONB
);

-- Enable RLS on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can see audit logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_log
  FOR SELECT USING (public.is_admin());

-- Generic trigger function for auditing
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_uid UUID;
BEGIN
    -- Get current user ID if available
    BEGIN
        current_uid := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        current_uid := NULL;
    END;

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_payload)
        VALUES (current_uid, TG_OP, TG_TABLE_NAME, OLD.id::text, row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_log (user_id, action, table_name, record_id, payload, old_payload)
        VALUES (current_uid, TG_OP, TG_TABLE_NAME, NEW.id::text, row_to_json(NEW)::jsonb, row_to_json(OLD)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_log (user_id, action, table_name, record_id, payload)
        VALUES (current_uid, TG_OP, TG_TABLE_NAME, NEW.id::text, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to all existing tables (that have an 'id' column)
DO $$
DECLARE
    tbl record;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename != 'audit_log'
        AND tablename NOT LIKE 'admin_%' -- Skip internal admin logs to avoid recursion if they are processed differently
    LOOP
        -- Check if 'id' column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tbl.tablename AND column_name = 'id') THEN
            EXECUTE format('DROP TRIGGER IF EXISTS audit_trigger ON public.%I', tbl.tablename);
            EXECUTE format('CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.process_audit_log()', tbl.tablename);
        END IF;
    END LOOP;
END $$;

-- Specifically ensure RLS is enabled on all tables (as requested, though research showed it mostly is)
DO $$
DECLARE
    tbl record;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    END LOOP;
END $$;

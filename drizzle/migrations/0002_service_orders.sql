CREATE TABLE public.service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer UNIQUE,
  cliente text NOT NULL DEFAULT '',
  pdf_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_orders TO authenticated;
GRANT ALL ON public.service_orders TO service_role;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin all service orders" ON public.service_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.next_os_number()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT GREATEST(COALESCE(MAX(numero), 6), 6) + 1 FROM public.service_orders
$$;
REVOKE EXECUTE ON FUNCTION public.next_os_number() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.next_os_number() TO authenticated;

CREATE POLICY "admin read os files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'service-orders' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin upload os files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'service-orders' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete os files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'service-orders' AND public.has_role(auth.uid(),'admin'));
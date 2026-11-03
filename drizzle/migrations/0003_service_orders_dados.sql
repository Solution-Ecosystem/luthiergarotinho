ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS dados jsonb;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS valor numeric(12,2);
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS data_entrada date;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS data_entrega date;
CREATE POLICY "admin update os files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'service-orders' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'service-orders' AND public.has_role(auth.uid(),'admin'));
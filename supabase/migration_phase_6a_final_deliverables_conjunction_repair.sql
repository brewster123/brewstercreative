-- ==============================================================================
-- DESTALION — Phase 6A: Final Deliverables Conjunction Security Repair (Minimal)
-- Target: Enforce Strict (Paid AND total_paid = true) on Client-Facing Policies
-- ==============================================================================
-- Scope & Blast Radius:
--   - Touches ONLY the 2 client-facing SELECT policies requiring payment conjunction.
--   - Touches ONLY the privacy toggle of 'final-deliverables' (if not already false).
--   - Does NOT drop or recreate existing admin policies.
--   - Does NOT alter file size limits, MIME types, or other bucket configuration.
--   - Does NOT modify application files, commission records, or authentication.
--
-- Execution:
--   Review this script and run it in the Supabase Dashboard SQL Editor (SQL Editor > New Query).
--   Do not run automated/unattended deployments against production.
-- ==============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Client Table Policy Repair: public.commission_deliverables
-- -----------------------------------------------------------------------------
-- Ensure Row-Level Security is active on the deliverables table
ALTER TABLE IF EXISTS public.commission_deliverables ENABLE ROW LEVEL SECURITY;

-- Safely drop only the client-facing SELECT policy to replace with the strict conjunction
DROP POLICY IF EXISTS "Clients can view deliverables for their commissions" ON public.commission_deliverables;

-- Recreate client SELECT policy requiring:
--   1. Commission ownership: c.client_id = auth.uid()
--   2. Both payment conditions: c.payment_status = 'Paid' AND c.total_paid = true
CREATE POLICY "Clients can view deliverables for their commissions"
  ON public.commission_deliverables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.commissions c
      WHERE c.id = commission_deliverables.commission_id
        AND c.client_id = auth.uid()
        AND c.payment_status = 'Paid'
        AND c.total_paid = true
    )
  );

-- (NOTE: Existing admin policies on public.commission_deliverables are strictly PRESERVED
--  and NOT dropped or recreated).

-- -----------------------------------------------------------------------------
-- 2. Storage Bucket Privacy Assurance: 'final-deliverables'
-- -----------------------------------------------------------------------------
-- Ensure the bucket is private without altering its file_size_limit or any other configuration
UPDATE storage.buckets
SET public = false
WHERE id = 'final-deliverables'
  AND public IS DISTINCT FROM false;

-- -----------------------------------------------------------------------------
-- 3. Client Storage Policy Repair: storage.objects ('final-deliverables')
-- -----------------------------------------------------------------------------
-- Safely drop only the client-facing storage policy
DROP POLICY IF EXISTS "Clients can view final deliverables for own commissions" ON storage.objects;

-- Recreate client storage policy requiring:
--   1. Bucket containment: bucket_id = 'final-deliverables'
--   2. Commission ID folder match: c.id::text = split_part(ltrim(name, '/'), '/', 1)
--   3. Commission ownership: c.client_id = auth.uid()
--   4. Both payment conditions: c.payment_status = 'Paid' AND c.total_paid = true
CREATE POLICY "Clients can view final deliverables for own commissions"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'final-deliverables'
    AND EXISTS (
      SELECT 1 FROM public.commissions c
      WHERE c.id::text = split_part(ltrim(name, '/'), '/', 1)
        AND c.client_id = auth.uid()
        AND c.payment_status = 'Paid'
        AND c.total_paid = true
    )
  );

-- (NOTE: Existing admin storage policies on storage.objects are strictly PRESERVED
--  and NOT dropped or recreated).

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ==============================================================================
-- READ-ONLY POST-APPLY VERIFICATION QUERIES
-- Run these queries after executing the transaction above to verify configuration.
-- ==============================================================================

-- 1. Verify Client Table Policy Definition
-- Expectation: qual must contain `payment_status = 'Paid'` AND `total_paid = true`
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'commission_deliverables'
  AND policyname = 'Clients can view deliverables for their commissions';

-- 2. Verify Client Storage Policy Definition
-- Expectation: qual must contain `bucket_id = 'final-deliverables'` AND `payment_status = 'Paid'` AND `total_paid = true`
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname = 'Clients can view final deliverables for own commissions';

-- 3. Verify 'final-deliverables' Bucket Privacy
-- Expectation: public must be false; file_size_limit remains intact
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'final-deliverables';

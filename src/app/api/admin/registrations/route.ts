import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const [{ data: pending, error: pendingError }, { data: all, error: allError }] =
      await Promise.all([
        supabaseAdmin
          .from('registrations')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        supabaseAdmin.from('registrations').select('status, batch_selection'),
      ]);

    if (pendingError) throw pendingError;
    if (allError) throw allError;

    const stats = {
      total: all?.length || 0,
      pending: all?.filter((r) => r.status === 'pending').length || 0,
      verified: all?.filter((r) => r.status === 'verified').length || 0,
      batch_1: all?.filter((r) => r.batch_selection === 'Batch 1').length || 0,
      batch_2: all?.filter((r) => r.batch_selection === 'Batch 2').length || 0,
      batch_3: all?.filter((r) => r.batch_selection === 'Batch 3').length || 0,
    };

    // ከ stats በኋላ, return በፊት
const pendingWithUrls = await Promise.all(
  (pending || []).map(async (student) => {
    if (student.receipt_url && student.receipt_url !== 'Pending Verification') {
      // URL ከ storage path አውጣ
      const path = student.receipt_url.split('/receipts/')[1]
      if (path) {
        const { data } = await supabaseAdmin.storage
          .from('receipts')
          .createSignedUrl(path, 60 * 60) // 1 hour
        if (data?.signedUrl) {
          return { ...student, receipt_url: data.signedUrl }
        }
      }
    }
    return student
  })
)

return NextResponse.json({ pending: pendingWithUrls, stats });


  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
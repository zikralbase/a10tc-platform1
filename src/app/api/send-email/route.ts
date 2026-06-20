import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailRequestBody {
  isAdminNotification?: boolean;
  studentName?: string;
  studentEmail?: string;
  batch_selection?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SendEmailRequestBody;
    const adminEmail = process.env.ADMIN_EMAIL || 'aishatech19@gmail.com';

    if (body.isAdminNotification) {
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'Aisha Tech <onboarding@resend.dev>',
        to: adminEmail,
        subject: 'A10TC — አዲስ ተማሪ ተመዝግቧል! 🚀',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2>አዲስ ምዝገባ ጥያቄ!</h2>
            <p><strong>ስም:</strong> ${body.studentName}</p>
            <p><strong>ኢሜይል:</strong> ${body.studentEmail}</p>
            <p><strong>Batch:</strong> ${body.batch_selection || 'N/A'}</p>
            <p>እባክሽ <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://a10tc-platform1.vercel.app'}/admin">Admin Dashboard</a> ላይ ገብተሽ payment ፈትሽ።</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
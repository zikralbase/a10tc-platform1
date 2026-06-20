import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const TELEGRAM_LINKS: Record<string, string> = {
  'Batch 1': process.env.TELEGRAM_BATCH_1_LINK || 'https://t.me/+UPd0w5ezq69jZWI0',
  'Batch 2': process.env.TELEGRAM_BATCH_2_LINK || 'https://t.me/+BQzgLgrRyHEyY2M0',
  'Batch 3': process.env.TELEGRAM_BATCH_3_LINK || 'https://t.me/+CtUPBAaXAwYyNGJk',
};

interface VerifyRequestBody {
  id: string;
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { id } = (await req.json()) as VerifyRequestBody;

    const { data: student, error: fetchError } = await supabaseAdmin
      .from('registrations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !student) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('registrations')
      .update({ status: 'verified' })
      .eq('id', id);

    if (updateError) throw updateError;

    const telegramLink = TELEGRAM_LINKS[student.batch_selection];
    if (!telegramLink) {
      return NextResponse.json({ error: 'Invalid batch selection.' }, { status: 400 });
    }

    await transporter.sendMail({
      from: `"Aisha Tech" <${process.env.GMAIL_USER}>`,
      to: student.email,
      subject: 'A10TC — Payment Verified! Join Your Telegram Group 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #050505; color: #fff; padding: 32px; border-radius: 16px;">
          <h2 style="color: #00DF89;">Congratulations, ${student.full_name}! 🎉</h2>
          <p>Your payment has been verified. Welcome to <strong>Aisha's 10-day Tech Challenge</strong>!</p>
          <p><strong>Your Batch:</strong> ${student.batch_selection}</p>
          <p>Click below to join your private Telegram group:</p>
          <a href="${telegramLink}" style="display: inline-block; background: #00DF89; color: #000; padding: 14px 28px; border-radius: 10px; font-weight: bold; text-decoration: none; margin: 16px 0;">
            Join Telegram Group →
          </a>
          <p style="color: #888; font-size: 12px; margin-top: 24px;">© 2026 Aisha's Tech | A10TC Program</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
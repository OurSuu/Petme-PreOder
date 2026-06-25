import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'กรุณากรอกอีเมล' }, { status: 400 });

    const user = await prisma.customer.findUnique({ where: { email } });
    if (!user) {
      // เพื่อความปลอดภัย จะไม่แจ้งว่ามีอีเมลนี้ในระบบหรือไม่
      return NextResponse.json({ success: true });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 ชั่วโมง

    await prisma.customer.update({
      where: { email },
      data: { resetToken, resetTokenExpiry }
    });

    // ดึง URL ของเว็บ (เช่น https://petme-pre-oder.vercel.app)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is missing. Reset link:', resetLink);
      return NextResponse.json({ success: true });
    }

    // ส่งอีเมลผ่าน Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'PetMe PreOrder <onboarding@resend.dev>', 
        to: email,
        subject: 'เปลี่ยนรหัสผ่านของคุณ - PetMe PreOrder',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>แจ้งเตือนการเปลี่ยนรหัสผ่าน</h2>
            <p>สวัสดีคุณ ${user.name || user.username},</p>
            <p>เราได้รับคำขอให้ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณบน PetMe PreOrder</p>
            <p>หากคุณเป็นผู้ขอ กรุณาคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์นี้จะมีอายุ 1 ชั่วโมง)</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #d4af37; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">ตั้งรหัสผ่านใหม่</a>
            <p>หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            <p>หากคุณไม่ได้ขอเปลี่ยนรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
          </div>
        `
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error('Resend error:', errData);
      return NextResponse.json({ error: 'ไม่สามารถส่งอีเมลได้ กรุณาตรวจสอบการตั้งค่า Resend' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

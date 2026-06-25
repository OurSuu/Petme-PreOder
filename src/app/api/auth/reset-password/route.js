import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    const user = await prisma.customer.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() } // Token ต้องยังไม่หมดอายุ
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'ลิงก์เปลี่ยนรหัสผ่านไม่ถูกต้อง หรือหมดอายุแล้ว' }, { status: 400 });
    }

    // เข้ารหัสรหัสผ่านใหม่
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // อัปเดตรหัสผ่าน และเคลียร์ Token
    await prisma.customer.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

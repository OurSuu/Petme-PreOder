import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { sendNotify } from '@/lib/line';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev_petme';

// สร้าง Secure Token สำหรับผูก LINE (รูปแบบ: PETME-XXXXXX)
function generateSecureToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ตัดตัวที่สับสนออก (0,O,1,I)
  let result = 'PETME-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET() {
  try {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      customerName, phone, houseNo, moo, soi, subDistrict, district, province, postalCode, 
      lineId, productName, color, size, quantity, note 
    } = body;
    
    // Required fields check
    if (!customerName || !phone || !houseNo || !subDistrict || !district || !province || !postalCode || !productName || !color || !size) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const qty = quantity || 1;
    const totalPrice = qty * 390;

    // Get user from token
    let customerId = null;
    const token = request.cookies.get('token')?.value;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        customerId = decoded.userId;
      } catch (e) {
        console.error('Invalid token during order creation');
      }
    }

    // สร้าง Secure Token สำหรับผูก LINE
    const secureToken = generateSecureToken();
    
    const order = await prisma.order.create({
      data: { 
        customerId,
        customerName, phone, houseNo, moo: moo || null, soi: soi || null, subDistrict, district, province, postalCode, 
        lineId: lineId || null, productName, color, size, quantity: qty, totalPrice, note: note || null,
        secureToken,
      }
    });
    
    // ยิงข้อมูลไปที่ External Backend (Webhook) หากตั้งค่าไว้
    if (process.env.EXTERNAL_BACKEND_URL) {
      try {
        await fetch(process.env.EXTERNAL_BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
      } catch (webhookErr) {
        console.error('Failed to send webhook to external backend:', webhookErr);
      }
    }
    
    // แจ้งเตือนแอดมินผ่าน LINE Notify
    await sendNotify(`🛒 มีออเดอร์ใหม่!\nออเดอร์ #${order.id}\nจากคุณ: ${order.customerName}\nยอดชำระ: ${order.totalPrice} บาท`);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

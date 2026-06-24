import generatePayload from 'promptpay-qr';
import qrcode from 'qrcode';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const amountStr = searchParams.get('amount');
    const amount = amountStr ? parseFloat(amountStr) : 0;
    
    // ดึงเบอร์พร้อมเพย์จาก Environment Variable
    // ถ้ายังไม่ได้ตั้งค่า ให้ใช้เบอร์จำลองไปก่อน (เพื่อป้องกัน error)
    const promptpayId = process.env.PROMPTPAY_ID || '0800000000';
    
    const payload = generatePayload(promptpayId, { amount });
    
    // สร้าง QR Code เป็น Buffer (PNG)
    const qrBuffer = await qrcode.toBuffer(payload, {
      type: 'png',
      margin: 2,
      width: 400,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    return new NextResponse(qrBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('QR Generate Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

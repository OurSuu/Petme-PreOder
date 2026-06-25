import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { pushMessage } from '@/lib/line';

export async function POST(request, { params }) {
  try {
    const { id } = params;

    const order = await prisma.order.findUnique({
      where: { id: Number(id) }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.lineUid) {
      return NextResponse.json({ error: 'Order not linked to LINE' }, { status: 400 });
    }

    const address = `บ้านเลขที่ ${order.houseNo || ''} ${order.moo ? `ม.${order.moo}` : ''} ${order.soi ? `ซ.${order.soi}` : ''} ต.${order.subDistrict || ''} อ.${order.district || ''} จ.${order.province || ''} ${order.postalCode || ''}`;
      
    const msg = `🚨 [สำคัญมาก] เตรียมจัดส่งสินค้า!
รบกวนลูกค้าตรวจสอบและยืนยันที่อยู่จัดส่งด้านล่างนี้ค่ะ:

ชื่อผู้รับ: ${order.customerName}
เบอร์โทร: ${order.phone}
ที่อยู่:
${address.replace(/  +/g, ' ').trim()}

ลูกค้าแน่ใจกับที่อยู่นี้แล้วใช่ไหมคะ?
- หากที่อยู่ถูกต้อง พิมพ์คำว่า: "ยืนยันที่อยู่"
- หากต้องการแก้ไข พิมพ์คำว่า: "แก้ไขที่อยู่"`;

    await pushMessage(order.lineUid, [{ type: 'text', text: msg }]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Request confirmation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

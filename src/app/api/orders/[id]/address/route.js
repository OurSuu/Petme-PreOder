import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { pushMessage } from '@/lib/line';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: {
        customerName: body.customerName,
        phone: body.phone,
        houseNo: body.houseNo,
        moo: body.moo,
        soi: body.soi,
        subDistrict: body.subDistrict,
        district: body.district,
        province: body.province,
        postalCode: body.postalCode,
        addressConfirmed: false // รีเซ็ตการยืนยันเมื่อมีการแก้ไข
      }
    });

    // ส่งข้อความไปให้ลูกค้าตรวจสอบที่อยู่ใหม่
    if (updatedOrder.lineUid) {
      const address = `บ้านเลขที่ ${updatedOrder.houseNo || ''} ${updatedOrder.moo ? `ม.${updatedOrder.moo}` : ''} ${updatedOrder.soi ? `ซ.${updatedOrder.soi}` : ''} ต.${updatedOrder.subDistrict || ''} อ.${updatedOrder.district || ''} จ.${updatedOrder.province || ''} ${updatedOrder.postalCode || ''}`;
      
      const msg = `🚨 [สำคัญมาก] รับทราบการแก้ไขที่อยู่!
แอดมินได้ทำการอัปเดตที่อยู่ให้ใหม่แล้ว รบกวนตรวจสอบอีกครั้งค่ะ:

ชื่อผู้รับ: ${updatedOrder.customerName}
เบอร์โทร: ${updatedOrder.phone}
ที่อยู่:
${address.replace(/  +/g, ' ').trim()}

ลูกค้าแน่ใจกับที่อยู่นี้แล้วใช่ไหมคะ?
- หากที่อยู่ถูกต้อง พิมพ์คำว่า: "ยืนยันที่อยู่"
- หากยังไม่ถูกต้อง พิมพ์คำว่า: "แก้ไขที่อยู่"`;

      await pushMessage(updatedOrder.lineUid, [{ type: 'text', text: msg }]);
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Update address error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

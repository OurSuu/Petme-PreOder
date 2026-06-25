import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { pushMessage, getStatusMessage } from '@/lib/line';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const oldOrder = await prisma.order.findUnique({ where: { id: parseInt(id) } });

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: body,
    });

    // ถ้ามีการเปลี่ยนสถานะ และออเดอร์นี้มี lineUid → ส่งแจ้งเตือนผ่าน LINE
    if (body.status && order.lineUid && body.status !== oldOrder.status) {
      const statusMsg = getStatusMessage(order, body.status);
      if (statusMsg) {
        await pushMessage(order.lineUid, [{ type: 'text', text: statusMsg.text }]);
      }
      
      if (body.status === 'confirmed' && !order.addressConfirmed) {
        const { sendAddressConfirmationRequest } = require('@/lib/line');
        await sendAddressConfirmationRequest(order);
      }
    } 
    // ถ้าไม่มีการเปลี่ยนสถานะ (หรือไม่ได้เปลี่ยนเป็น shipped) แต่มีการเพิ่มเลขพัสดุใหม่ แยกมาต่างหาก
    else if (body.trackingNumbers && order.lineUid) {
      const oldTracking = oldOrder?.trackingNumbers || [];
      const newTracking = body.trackingNumbers || [];
      const addedTracking = newTracking.filter(t => !oldTracking.includes(t));
      
      if (addedTracking.length > 0) {
        const trackingText = addedTracking.join(', ');
        await pushMessage(order.lineUid, [{ 
          type: 'text', 
          text: `🚚 มีการอัปเดตเลขพัสดุสำหรับออเดอร์ #${order.id} ค่ะ\n\nเลขพัสดุ: ${trackingText}\n\nคุณลูกค้าสามารถนำเลขพัสดุไปเช็คสถานะการจัดส่งได้เลยนะคะ ขอบคุณที่อุดหนุนค่ะ 🙏` 
        }]);
      }
    }

    // Webhook Trigger: Send update to external backend for all changes
    if (process.env.EXTERNAL_BACKEND_URL) {
      try {
        await fetch(process.env.EXTERNAL_BACKEND_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-api-key': process.env.PETME_SECRET_TOKEN || ''
          },
          body: JSON.stringify(order)
        });
      } catch (webhookErr) {
        console.error('Failed to send webhook to external backend:', webhookErr);
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.order.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}

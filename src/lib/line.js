// LINE Messaging API Utility
const LINE_API = 'https://api.line.me/v2/bot';
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
};

// ส่งข้อความแบบ Push (ส่งไปหาลูกค้าได้ทุกเมื่อ)
export async function pushMessage(userId, messages) {
  if (!TOKEN || !userId) return;
  try {
    await fetch(`${LINE_API}/message/push`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ to: userId, messages }),
    });
  } catch (e) {
    console.error('LINE pushMessage error:', e);
  }
}

// ส่งข้อความแจ้งเตือนเข้ากลุ่มแอดมิน (LINE Notify)
export async function sendNotify(message) {
  const notifyToken = process.env.LINE_NOTIFY_TOKEN;
  if (!notifyToken) return;
  
  try {
    const params = new URLSearchParams();
    params.append('message', message);
    
    await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${notifyToken}`,
      },
      body: params,
    });
  } catch (e) {
    console.error('LINE Notify error:', e);
  }
}

// ตอบกลับข้อความ (ใช้ replyToken จาก webhook event)
export async function replyMessage(replyToken, messages) {
  if (!TOKEN) return;
  try {
    await fetch(`${LINE_API}/message/reply`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ replyToken, messages }),
    });
  } catch (e) {
    console.error('LINE replyMessage error:', e);
  }
}

// ดาวน์โหลดรูปภาพจาก LINE (เช่น สลิปโอนเงิน)
export async function getImageContent(messageId) {
  if (!TOKEN) return null;
  try {
    const res = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return Buffer.from(buffer);
    }
  } catch (e) {
    console.error('LINE getImageContent error:', e);
  }
  return null;
}

// ตรวจสอบ Signature ของ Webhook (ป้องกันคนปลอมส่งข้อมูลมา)
export function verifySignature(body, signature) {
  const crypto = require('crypto');
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) return false;
  
  try {
    const hash = crypto
      .createHmac('SHA256', channelSecret)
      .update(body, 'utf8')
      .digest('base64');
    return hash === signature;
  } catch (e) {
    console.error('Signature check error:', e);
    return false;
  }
}

export function getStatusMessage(order, status) {
  const address = `บ้านเลขที่ ${order.houseNo || ''} ${order.moo ? `ม.${order.moo}` : ''} ${order.soi ? `ซ.${order.soi}` : ''} ต.${order.subDistrict || ''} อ.${order.district || ''} จ.${order.province || ''} ${order.postalCode || ''}`;
  
  const statusMessages = {
    'confirmed': {
      text: `✅ ออเดอร์ #${order.id} ยืนยันแล้ว!\n\nทางร้านได้รับการยืนยันคำสั่งซื้อของคุณเรียบร้อยแล้วค่ะ กำลังดำเนินการผลิตให้เร็วที่สุดนะคะ 🙏`,
    },
    'producing': {
      text: `🔨 ออเดอร์ #${order.id} กำลังผลิต!\n\nสินค้าของคุณกำลังอยู่ในขั้นตอนการผลิตแล้วค่ะ รอสักครู่นะคะ ❤️`,
    },
    'shipped': {
      text: `📦 ออเดอร์ #${order.id} จัดส่งแล้ว!\n\nเรียนคุณ ${order.customerName},\nสินค้าของคุณถูกจัดส่งเรียบร้อยแล้วค่ะ!\n\n📍 ที่อยู่จัดส่ง:\n${address.replace(/  +/g, ' ').trim()}\n\n🚚 เลขพัสดุ: ${order.trackingNumbers && order.trackingNumbers.length > 0 ? order.trackingNumbers.join(', ') : 'รออัปเดต'}\n\nขอบคุณที่อุดหนุนค่ะ 🎉`,
    },
    'cancelled': {
      text: `❌ ออเดอร์ #${order.id} ถูกยกเลิก\n\nคำสั่งซื้อของคุณถูกยกเลิกแล้วค่ะ หากมีข้อสงสัยกรุณาติดต่อทางร้านค่ะ`,
    },
  };
  return statusMessages[status] || null;
}

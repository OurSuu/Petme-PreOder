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
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}

// สร้างข้อความแจ้งเตือนสถานะตามประเภท
export function getStatusMessage(orderId, status) {
  const statusMessages = {
    'confirmed': {
      text: `✅ ออเดอร์ #${orderId} ยืนยันแล้ว!\n\nทางร้านได้รับการยืนยันคำสั่งซื้อของคุณเรียบร้อยแล้วค่ะ กำลังดำเนินการผลิตให้เร็วที่สุดนะคะ 🙏`,
    },
    'producing': {
      text: `🔨 ออเดอร์ #${orderId} กำลังผลิต!\n\nสินค้าของคุณกำลังอยู่ในขั้นตอนการผลิตแล้วค่ะ รอสักครู่นะคะ ❤️`,
    },
    'shipped': {
      text: `📦 ออเดอร์ #${orderId} จัดส่งแล้ว!\n\nสินค้าของคุณถูกจัดส่งเรียบร้อยแล้วค่ะ! รอรับสินค้าได้เลยนะคะ 🎉`,
    },
    'cancelled': {
      text: `❌ ออเดอร์ #${orderId} ถูกยกเลิก\n\nคำสั่งซื้อของคุณถูกยกเลิกแล้วค่ะ หากมีข้อสงสัยกรุณาติดต่อทางร้านค่ะ`,
    },
  };
  return statusMessages[status] || null;
}

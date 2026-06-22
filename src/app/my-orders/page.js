'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check auth
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          window.location.href = '/login';
        } else {
          setUser(data.user);
          fetchOrders();
        }
      })
      .catch(() => window.location.href = '/login');
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/my-orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders');
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span style={{ padding: '6px 12px', background: 'rgba(255,193,7,0.2)', color: '#ffc107', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>🟡 รอดำเนินการ (รอชำระเงิน)</span>;
      case 'confirmed': return <span style={{ padding: '6px 12px', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>🟢 ยืนยันแล้ว (ชำระเงินแล้ว)</span>;
      case 'producing': return <span style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>🟠 กำลังผลิต</span>;
      case 'shipped': return <span style={{ padding: '6px 12px', background: 'rgba(34,197,94,0.2)', color: '#22c55e', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>🔵 จัดส่งแล้ว</span>;
      case 'cancelled': return <span style={{ padding: '6px 12px', background: 'rgba(100,100,100,0.2)', color: '#aaa', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>🔴 ยกเลิกคำสั่งซื้อ</span>;
      default: return <span>{status}</span>;
    }
  };

  if (loading) {
    return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>กำลังโหลด...</div>;
  }

  return (
    <div style={{ minHeight: '80vh', padding: '40px 20px' }}>
      <div className="wrap" style={{ maxWidth: '900px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <Link href="/" style={{ color: '#888', fontSize: '14px', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>← กลับไปหน้าแรก</Link>
            <h1 style={{ color: 'var(--gold)', fontSize: '28px' }}>คลังออเดอร์ของฉัน</h1>
            <p style={{ color: '#ccc', marginTop: '4px' }}>บัญชี: {user?.username} ({user?.name})</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', padding: '60px 20px', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--line)' }}>
            <h3 style={{ color: '#888', marginBottom: '15px' }}>คุณยังไม่มีคำสั่งซื้อ</h3>
            <Link href="/#shop" className="btn btn-primary">ดูคอลเล็กชันสินค้า</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map(order => (
              <div key={order.id} style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>ออเดอร์ #{order.id}</h3>
                    <span style={{ color: '#888', fontSize: '13px' }}>วันที่สั่งซื้อ: {new Date(order.createdAt).toLocaleDateString('th-TH')}</span>
                  </div>
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: '250px' }}>
                    <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '4px' }}>สินค้า</p>
                    <p style={{ fontWeight: 'bold' }}>{order.productName}</p>
                    <p style={{ fontSize: '14px', color: '#ccc' }}>สี: {order.color} | ไซส์: {order.size} | จำนวน: {order.quantity} ตัว</p>
                    <p style={{ marginTop: '10px', fontSize: '18px', color: 'var(--gold)', fontWeight: 'bold' }}>ยอดรวม: {order.totalPrice} ฿</p>
                  </div>
                  <div style={{ flex: '1', minWidth: '250px' }}>
                    <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '4px' }}>ข้อมูลจัดส่ง</p>
                    <p style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.5' }}>
                      ชื่อผู้รับ: {order.customerName}<br/>
                      เบอร์โทร: {order.phone}<br/>
                      บ้านเลขที่ {order.houseNo} {order.moo ? `ม.${order.moo}` : ''} {order.soi ? `ซ.${order.soi}` : ''} ต.{order.subDistrict} อ.{order.district} จ.{order.province} {order.postalCode}
                    </p>
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div style={{ marginTop: '10px', padding: '16px', background: 'rgba(212,175,55,0.05)', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.2)' }}>
                    <p style={{ fontSize: '14px', marginBottom: '10px' }}>
                      ออเดอร์นี้กำลังรอการยืนยันการชำระเงิน หากคุณยังไม่ได้ชำระเงิน กรุณาติดต่อเราผ่าน LINE พร้อมแจ้งรหัสออเดอร์ <strong>#{order.id}</strong>
                    </p>
                    <a href="https://line.me/ti/p/~@petmeshirt" target="_blank" className="btn btn-ghost" style={{ fontSize: '13px', padding: '6px 12px', border: '1px solid var(--gold)', color: 'var(--gold)' }}>
                      ติดต่อร้านผ่าน LINE
                    </a>
                  </div>
                )}
                
                {order.status === 'cancelled' && (
                  <div style={{ marginTop: '10px', padding: '16px', background: 'rgba(239,68,68,0.05)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <p style={{ fontSize: '14px', color: '#ef4444' }}>
                      คำสั่งซื้อนี้ถูกยกเลิกแล้ว อาจเนื่องมาจากไม่ได้รับการยืนยันการชำระเงินภายในเวลาที่กำหนด หากมีข้อสงสัยกรุณาติดต่อร้านค้า
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

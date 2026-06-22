'use client';

import { useState, useEffect } from 'react';
import { login } from './actions';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const res = await login(username, password);
    if (res.success) {
      setIsAuthenticated(true);
    } else {
      setLoginError(res.error);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteOrder = async (id) => {
    if (!confirm('คุณต้องการลบคำสั่งซื้อนี้ใช่หรือไม่?')) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-box">
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {loginError && <div className="login-error">{loginError}</div>}
            <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  // คำนวณสถิติ
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  let todayPending = 0;
  let todayConfirmed = 0;
  let todayProducing = 0;
  let todayShipped = 0;

  let monthCount = 0;
  let yearCount = 0;

  orders.forEach(o => {
    const d = new Date(o.createdAt);
    const orderDate = d.toISOString().split('T')[0];
    
    // สถานะสำหรับวันนี้
    if (orderDate === today) {
      if (o.status === 'pending') todayPending++;
      if (o.status === 'confirmed') todayConfirmed++;
      if (o.status === 'producing') todayProducing++;
      if (o.status === 'shipped') todayShipped++;
    }
    
    // นับยอดรวม (จำนวนตัว)
    if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) monthCount += o.quantity;
    if (d.getFullYear() === thisYear) yearCount += o.quantity;
  });

  return (
    <div className="admin-container">
      <div className="wrap" style={{ maxWidth: '1400px' }}>
        <div className="admin-header">
          <h1>จัดการคำสั่งซื้อ (Pre-Order)</h1>
          <button className="btn btn-ghost" onClick={() => setIsAuthenticated(false)}>Logout</button>
        </div>

        <h2 style={{ fontSize: '18px', marginBottom: '14px', color: 'var(--gold)' }}>ออเดอร์ของวันนี้ (รายการ)</h2>
        <div className="admin-stats" style={{ marginBottom: '20px' }}>
          <div className="stat-card pending">
            <div className="stat-label">รอดำเนินการ</div>
            <div className="stat-value">{todayPending}</div>
          </div>
          <div className="stat-card confirmed">
            <div className="stat-label">ยืนยันแล้ว</div>
            <div className="stat-value" style={{color: '#3b82f6'}}>{todayConfirmed}</div>
          </div>
          <div className="stat-card producing">
            <div className="stat-label">กำลังผลิต</div>
            <div className="stat-value" style={{color: 'var(--red)'}}>{todayProducing}</div>
          </div>
          <div className="stat-card shipped">
            <div className="stat-label">จัดส่งแล้ว</div>
            <div className="stat-value" style={{color: '#22c55e'}}>{todayShipped}</div>
          </div>
        </div>

        <h2 style={{ fontSize: '18px', marginBottom: '14px', color: 'var(--gold)' }}>ยอดขายภาพรวม (จำนวนตัว)</h2>
        <div className="admin-stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '30px' }}>
          <div className="stat-card">
            <div className="stat-label">ยอดขายเดือนนี้</div>
            <div className="stat-value">{monthCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">ยอดขายปีนี้</div>
            <div className="stat-value">{yearCount}</div>
          </div>
        </div>

        <div className="admin-table-wrap">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>กำลังโหลดข้อมูล...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>วันที่</th>
                  <th>ลูกค้า</th>
                  <th>ติดต่อ</th>
                  <th>ที่อยู่จัดส่ง</th>
                  <th>สินค้า</th>
                  <th>ไซส์/สี/จำนวน</th>
                  <th>ยอดรวม</th>
                  <th>หมายเหตุ</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan="11" style={{ textAlign: 'center', padding: '40px' }}>ไม่มีคำสั่งซื้อ</td></tr>
                ) : (
                  orders.map(o => (
                    <tr key={o.id}>
                      <td>#{o.id}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString('th-TH')}</td>
                      <td>{o.customerName}</td>
                      <td>
                        {o.phone}
                        {o.lineId && <div><small style={{color:'var(--gold)'}}>LINE: {o.lineId}</small></div>}
                      </td>
                      <td style={{ maxWidth: '200px', lineHeight: '1.4' }}>
                        บ้านเลขที่ {o.houseNo} 
                        {o.moo && ` ม.${o.moo}`} 
                        {o.soi && ` ซ.${o.soi}`} <br/>
                        ต.{o.subDistrict} อ.{o.district} <br/>
                        จ.{o.province} {o.postalCode}
                      </td>
                      <td>{o.productName}</td>
                      <td>{o.size} / {o.color} / x{o.quantity}</td>
                      <td>{o.totalPrice} ฿</td>
                      <td style={{ maxWidth: '120px' }}>{o.note || '-'}</td>
                      <td>
                        <select 
                          className="status-select" 
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                        >
                          <option value="pending">รอดำเนินการ</option>
                          <option value="confirmed">ยืนยันแล้ว</option>
                          <option value="producing">กำลังผลิต</option>
                          <option value="shipped">จัดส่งแล้ว</option>
                        </select>
                      </td>
                      <td>
                        <button className="delete-btn" onClick={() => deleteOrder(o.id)}>ลบ</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

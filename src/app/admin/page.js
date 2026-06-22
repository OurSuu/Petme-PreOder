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

  // การจัดการค้นหา, กรองสถานะ และแบ่งหน้า
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // การจัดการเลือกหลายรายการ (Bulk Actions)
  const [selectedOrders, setSelectedOrders] = useState([]);

  useEffect(() => {
    if (isAuthenticated) fetchOrders();
  }, [isAuthenticated]);

  // เมื่อเปลี่ยนฟิลเตอร์หรือคำค้น ให้กลับไปหน้าแรก
  useEffect(() => {
    setCurrentPage(1);
    setSelectedOrders([]);
  }, [searchTerm, statusFilter]);

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

  // --- Bulk Actions ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(currentItems.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (id) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter(oId => oId !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const bulkUpdateStatus = async (status) => {
    if (selectedOrders.length === 0) return;
    if (!confirm(`ต้องการเปลี่ยนสถานะ ${selectedOrders.length} รายการเป็น "${status}" ใช่หรือไม่?`)) return;

    setLoading(true);
    // อัปเดตพร้อมกันหลายรายการ
    await Promise.all(selectedOrders.map(id =>
      fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
    ));

    setSelectedOrders([]);
    fetchOrders();
  };

  // --- Export CSV ---
  const downloadCSV = () => {
    const headers = ['รหัส', 'วันที่', 'ลูกค้า', 'เบอร์โทร', 'LINE', 'ที่อยู่', 'สินค้า', 'ไซส์', 'สี', 'จำนวน', 'ยอดรวม', 'หมายเหตุ', 'สถานะ'];
    const rows = filteredOrders.map(o => {
      const address = `บ้านเลขที่ ${o.houseNo} ${o.moo ? `ม.${o.moo}` : ''} ${o.soi ? `ซ.${o.soi}` : ''} ต.${o.subDistrict} อ.${o.district} จ.${o.province} ${o.postalCode}`;
      return [
        o.id,
        new Date(o.createdAt).toLocaleDateString('th-TH'),
        `"${o.customerName}"`,
        `"${o.phone}"`,
        `"${o.lineId || ''}"`,
        `"${address}"`,
        `"${o.productName}"`,
        o.size,
        o.color,
        o.quantity,
        o.totalPrice,
        `"${o.note ? o.note.replace(/"/g, '""') : ''}"`,
        o.status
      ].join(',');
    });

    const csvContent = "\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  let todayPending = 0, todayConfirmed = 0, todayProducing = 0, todayShipped = 0;
  let monthCount = 0, yearCount = 0;

  orders.forEach(o => {
    const d = new Date(o.createdAt);
    const orderDate = d.toISOString().split('T')[0];

    if (orderDate === today) {
      if (o.status === 'pending') todayPending++;
      if (o.status === 'confirmed') todayConfirmed++;
      if (o.status === 'producing') todayProducing++;
      if (o.status === 'shipped') todayShipped++;
    }

    if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) monthCount += o.quantity;
    if (d.getFullYear() === thisYear) yearCount += o.quantity;
  });

  // กรองข้อมูล (Filter & Search)
  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const searchStr = searchTerm.toLowerCase();
    const matchesSearch =
      o.id.toString().includes(searchStr) ||
      o.customerName.toLowerCase().includes(searchStr) ||
      o.phone.includes(searchStr);
    return matchesStatus && matchesSearch;
  });

  // แบ่งหน้า (Pagination)
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

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
            <div className="stat-value" style={{ color: '#3b82f6' }}>{todayConfirmed}</div>
          </div>
          <div className="stat-card producing">
            <div className="stat-label">กำลังผลิต</div>
            <div className="stat-value" style={{ color: 'var(--red)' }}>{todayProducing}</div>
          </div>
          <div className="stat-card shipped">
            <div className="stat-label">จัดส่งแล้ว</div>
            <div className="stat-value" style={{ color: '#22c55e' }}>{todayShipped}</div>
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

        {/* แถบเครื่องมือจัดการออเดอร์ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="ค้นหาชื่อ, เบอร์โทร, หรือรหัส..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--bg-card)', color: '#fff' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--bg-card)', color: '#000000ff' }}
            >
              <option value="all">ทุกสถานะ</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="confirmed">ยืนยันแล้ว</option>
              <option value="producing">กำลังผลิต</option>
              <option value="shipped">จัดส่งแล้ว</option>
            </select>
          </div>

          <div>
            <button className="btn btn-primary" onClick={downloadCSV} style={{ padding: '8px 16px', fontSize: '14px' }}>
              📥 Export Excel (CSV)
            </button>
          </div>
        </div>

        {/* แถบเครื่องมือจัดการหลายรายการ (Bulk Actions) */}
        {selectedOrders.length > 0 && (
          <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>เลือกแล้ว {selectedOrders.length} รายการ</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ margin: 'auto 0' }}>เปลี่ยนสถานะเป็น:</span>
              <button onClick={() => bulkUpdateStatus('confirmed')} style={{ padding: '4px 8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>ยืนยันแล้ว</button>
              <button onClick={() => bulkUpdateStatus('producing')} style={{ padding: '4px 8px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>กำลังผลิต</button>
              <button onClick={() => bulkUpdateStatus('shipped')} style={{ padding: '4px 8px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>จัดส่งแล้ว</button>
            </div>
          </div>
        )}

        <div className="admin-table-wrap">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>กำลังโหลดข้อมูล...</div>
          ) : (
            <>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedOrders.length === currentItems.length && currentItems.length > 0}
                      />
                    </th>
                    <th>รหัส</th>
                    <th>วันที่</th>
                    <th>ลูกค้า</th>
                    <th>ติดต่อ</th>
                    <th>ที่อยู่จัดส่ง</th>
                    <th>สินค้า</th>
                    <th>ไซส์/สี/จำนวน</th>
                    <th>ยอดรวม</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 ? (
                    <tr><td colSpan="11" style={{ textAlign: 'center', padding: '40px' }}>ไม่พบข้อมูลที่ค้นหา</td></tr>
                  ) : (
                    currentItems.map(o => (
                      <tr key={o.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(o.id)}
                            onChange={() => handleSelectOrder(o.id)}
                          />
                        </td>
                        <td>#{o.id}</td>
                        <td>{new Date(o.createdAt).toLocaleDateString('th-TH')}</td>
                        <td>{o.customerName}</td>
                        <td>
                          {o.phone}
                          {o.lineId && <div><small style={{ color: 'var(--gold)' }}>LINE: {o.lineId}</small></div>}
                        </td>
                        <td style={{ maxWidth: '200px', lineHeight: '1.4' }}>
                          บ้านเลขที่ {o.houseNo}
                          {o.moo && ` ม.${o.moo}`}
                          {o.soi && ` ซ.${o.soi}`} <br />
                          ต.{o.subDistrict} อ.{o.district} <br />
                          จ.{o.province} {o.postalCode}
                        </td>
                        <td>{o.productName}</td>
                        <td>{o.size} / {o.color} / x{o.quantity}</td>
                        <td>{o.totalPrice} ฿</td>
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', gap: '15px' }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '8px 16px', borderRadius: '4px', background: currentPage === 1 ? 'var(--bg)' : 'var(--bg-card)', color: '#fff', border: '1px solid var(--line)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    ก่อนหน้า
                  </button>
                  <span>หน้าที่ {currentPage} จาก {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ padding: '8px 16px', borderRadius: '4px', background: currentPage === totalPages ? 'var(--bg)' : 'var(--bg-card)', color: '#fff', border: '1px solid var(--line)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    ถัดไป
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

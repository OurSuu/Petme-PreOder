'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!email.includes('@')) {
      setError('รูปแบบอีเมลไม่ถูกต้อง');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage('ระบบได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณแล้ว (หากมีบัญชีนี้ในระบบ)');
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการส่งอีเมล');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="login-box" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)', padding: '40px', borderRadius: '16px', border: '1px solid var(--line)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--gold)', marginBottom: '30px' }}>ลืมรหัสผ่าน</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>อีเมลที่ใช้สมัคร *</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--bg)', color: '#fff' }}
              placeholder="example@email.com"
            />
          </div>
          {error && (
            <div className="alert-error" style={{ marginBottom: '20px', color: '#ff4444', background: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '8px' }}>
              <span>⚠️</span> {error}
            </div>
          )}
          {message && (
            <div style={{ marginBottom: '20px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '10px', borderRadius: '8px' }}>
              <span>✅</span> {message}
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '16px' }}>
            {loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link href="/login" style={{ color: 'var(--gold)' }}>กลับไปหน้าเข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}

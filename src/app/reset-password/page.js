'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const router = useRouter();

  useEffect(() => {
    // using window.location to avoid Suspense requirement with useSearchParams
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) setToken(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!token) {
      setError('ไม่มี Token สำหรับเปลี่ยนรหัสผ่าน กรุณากดลิงก์จากในอีเมลอีกครั้ง');
      setLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage('ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว ระบบจะพากลับไปหน้าเข้าสู่ระบบ...');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="login-box" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)', padding: '40px', borderRadius: '16px', border: '1px solid var(--line)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--gold)', marginBottom: '30px' }}>ตั้งรหัสผ่านใหม่</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>รหัสผ่านใหม่ *</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--bg)', color: '#fff' }}
              placeholder="รหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร"
            />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>ยืนยันรหัสผ่านใหม่ *</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--bg)', color: '#fff' }}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
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
            {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link href="/login" style={{ color: 'var(--gold)' }}>กลับไปหน้าเข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}

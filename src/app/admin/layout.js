export const metadata = {
  title: 'Admin - PET ME SHIRT',
};

export default function AdminLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {children}
    </div>
  );
}

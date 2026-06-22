import { Anton, Archivo } from 'next/font/google';
import './globals.css';

const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton', display: 'swap' });
const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo', display: 'swap' });

export const metadata = {
  title: 'PET ME SHIRT — DROP 01',
  description: 'เสื้อยืดจากลายเส้นมือจริง วาดจากหมาตัวจริง ทุกตัวผลิตเมื่อมีคำสั่งซื้อ จำกัดจำนวน',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${anton.variable} ${archivo.variable}`}>
      <body>{children}</body>
    </html>
  );
}

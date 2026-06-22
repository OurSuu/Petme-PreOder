'use server';

export async function login(username, password) {
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    return { success: true };
  }
  return { success: false, error: 'Username หรือ Password ไม่ถูกต้อง' };
}

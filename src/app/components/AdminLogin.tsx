import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AdminPage } from '@/app/components/AdminPage';
import { Question } from '@/app/types';

interface AdminLoginProps {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
}

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '123456789?A';

export const AdminLogin: React.FC<AdminLoginProps> = ({ questions, setQuestions }) => {
  console.log('Rendering AdminLogin component');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);

  // NOTE: automatic loading from API on admin login removed per request.

  useEffect(() => {
    try {
      const stored = localStorage.getItem('isAdminAuth');
      setIsAuth(stored === 'true');
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      try {
        localStorage.setItem('isAdminAuth', 'true');
      } catch (e) {}
      setIsAuth(true);
      toast.success('Đăng nhập quản trị thành công');
    } else {
      toast.error('Tài khoản hoặc mật khẩu không đúng');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('isAdminAuth');
    } catch (e) {}
    setIsAuth(false);
    setUsername('');
    setPassword('');
    toast('Đã đăng xuất');
  };

  if (isAuth) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto">
          <div className="flex justify-end items-center mb-6">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md flex items-center gap-2"
            >
              Đăng xuất
            </button>
          </div>
          <AdminPage questions={questions} setQuestions={setQuestions} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 520, background: 'white', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', padding: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Đăng nhập quản trị</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#4b5563', marginBottom: 6 }}>Tài khoản</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#4b5563', marginBottom: 6 }}>Mật khẩu</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <button type="submit" style={{ padding: '8px 14px', background: '#2563eb', color: 'white', borderRadius: 8 }}>Đăng nhập</button>
            <a href="/home" style={{ color: '#6b7280', fontSize: 13 }}>Quay lại trang chính</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

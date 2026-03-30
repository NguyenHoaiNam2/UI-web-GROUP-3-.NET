import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import logoImage from '@/assets/logo.svg';
import { auth, googleProvider } from '@/firebase';
import { signInWithPopup } from 'firebase/auth';

interface AuthPageProps {
  onLogin: (userData: { name: string; email: string }) => void;
  onNavigateToPrivacy?: () => void;
}

export const AuthPage = ({ onLogin, onNavigateToPrivacy }: AuthPageProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // Đăng nhập qua API
        const response = await fetch('https://localhost:52207/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.name,
            password: formData.password
          })
        });

        if (!response.ok) {
          throw new Error('Đăng nhập thất bại. Kiểm tra lại thông tin.');
        }

        const data = await response.json();
        
        if (data.accessToken) {
          // Lưu token vào localStorage
          localStorage.setItem('accessToken', data.accessToken);
          
          onLogin({
            name: 'Người dùng', // Bạn có thể decode token để lấy tên nếu cần
            email: formData.email
          });
        } else {
          throw new Error('Không nhận được token từ server');
        }
      } else {
        // Xử lý đăng ký nếu cần
        onLogin({
          name: formData.name, 
          email: formData.email
        });
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      onLogin({
        name: user.displayName || 'Người dùng Google',
        email: user.email || ''
      });
    } catch (err: any) {
      console.error("Lỗi đăng nhập Google:", err);
      
      // Xử lý lỗi auth/api-key-not-valid
      if (err.code === 'auth/api-key-not-valid') {
        setError('Lỗi cấu hình Firebase: API Key không hợp lệ. Vui lòng cập nhật cấu hình trong src/firebase.ts');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Bạn đã đóng cửa sổ đăng nhập.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Yêu cầu đăng nhập bị hủy.');
      } else {
        setError(`Đăng nhập thất bại: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <div className="w-full max-w-md flex-grow flex flex-col justify-center">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <img 
            src={logoImage} 
            alt="Group 3 .NET Tech" 
            className="h-16 mx-auto mb-4 object-contain" 
          />
          <h1 className="text-3xl font-bold text-blue-800 mb-2">
            Chào mừng bạn
          </h1>
          <p className="text-gray-500">
            {isLogin ? 'Đăng nhập để tiếp tục học tập' : 'Tạo tài khoản mới để bắt đầu'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-start gap-3 animate-fade-in">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

  {/* Form Card */}
  <div className="bg-transparent rounded-2xl shadow-xl p-8 border border-blue-100">
          {/* Tab Switch */}
          <div className="flex gap-2 mb-6 bg-blue-50 p-1 rounded-lg">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                isLogin
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-blue-500'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <LogIn size={18} />
                <span>Đăng nhập</span>
              </div>
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                !isLogin
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-blue-500'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UserPlus size={18} />
                <span>Đăng ký</span>
              </div>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tên đăng nhập */}
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isLogin ? 'Tên đăng nhập' : 'Tên tài khoản (Username)'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={isLogin ? 'Nhập tên đăng nhập' : 'Nhập tên tài khoản để đăng ký'}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Email - chỉ hiện khi đăng ký */}
            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Mật khẩu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu - chỉ hiện khi đăng ký */}
            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Quên mật khẩu - chỉ hiện khi đăng nhập */}
            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 mt-6"
            >
              {isLogin ? (
                <>
                  <LogIn size={20} />
                  <span>Đăng nhập ngay</span>
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Tạo tài khoản</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-gray-500">hoặc</span>
            </div>
          </div>

          {/* Skip Login removed per request */}

          {/* Social Login */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className={`w-full bg-transparent border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>{isLoading ? 'Đang kết nối...' : 'Đăng nhập với Google'}</span>
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? (
              <p>
                Chưa có tài khoản?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Đăng ký ngay
                </button>
              </p>
            ) : (
              <p>
                Đã có tài khoản?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Đăng nhập ngay
                </button>
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Footer Note - visible and pinned to bottom */}
      <p className="mt-auto text-center text-sm text-gray-500 py-4">
        Bằng việc đăng nhập, bạn đồng ý với{' '}
        <a href="#" className="text-blue-600 hover:underline">Điều khoản sử dụng</a>
        {' '}và{' '}
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onNavigateToPrivacy?.();
          }}
          className="text-blue-600 hover:underline"
        >
          Chính sách bảo mật
        </button>
      </p>
    </div>
  );
};
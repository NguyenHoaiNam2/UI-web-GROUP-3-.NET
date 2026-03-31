import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import logoImage from '@/assets/logo.svg';

interface AuthPageProps {
  onLogin: (userData: { 
    name: string; 
    email: string; 
    role: 'USER' | 'ADMIN' 
  }) => void;
  onNavigateToPrivacy?: () => void;
  onBack?: () => void;
}

export const AuthPage = ({ onLogin, onNavigateToPrivacy, onBack }: AuthPageProps) => {
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
          localStorage.setItem('userRole', data.role === 1 ? 'ADMIN' : 'USER');
          
          onLogin({
            name: data.name || data.username || formData.name || 'Người dùng',
            email: data.email ?? formData.email,
            role: data.role === 1 ? 'ADMIN' : 'USER'
          });
        } else {
          throw new Error('Không nhận được token từ server');
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Mật khẩu xác nhận không khớp.');
        }

        // Đăng ký qua API
        const response = await fetch('https://localhost:52207/auth/register', {
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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        }

        // Đăng ký thành công, bạn có thể tự động gọi đăng nhập hoặc hiển thị thông báo
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  // Google login removed per request

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">
      {/* Left side: Cinematic Banner (Hidden on mobile, 50% width on lg) */}
      <div className="hidden lg:flex w-1/2 bg-blue-900 text-white flex-col justify-between p-12 relative">
        {/* Background Image with overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/50 to-blue-900/80 z-0"></div>

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <img src={logoImage} alt="Logo" className="h-10 brightness-0 invert" />
          <span className="text-xl font-bold tracking-wider">GROUP 3 .NET</span>
        </div>

        {/* Slogan */}
        <div className="relative z-10 mb-20 animate-fade-in-up">
          <h2 className="text-5xl font-extrabold mb-6 leading-tight">
            Hành trình <br/>
            <span className="text-blue-400">chinh phục</span> <br/>
            bằng lái của bạn
          </h2>
          <p className="text-blue-100 text-lg max-w-md leading-relaxed">
            Hệ thống ôn thi giấy phép lái xe hiện đại, cung cấp công cụ mạnh mẽ và trải nghiệm học tập nhất quán cho mọi thiết bị của bạn.
          </p>
        </div>

        {/* Bottom indicator */}
        <div className="relative z-10 flex items-center gap-4 text-blue-200 text-sm">
          <div className="w-10 h-10 border border-blue-400/30 rounded-full flex items-center justify-center animate-bounce-slow">
            <ArrowRight size={16} />
          </div>
          <span>Tham gia cùng hàng ngàn học viên khác</span>
        </div>
      </div>

      {/* Right side: Form Panel */}
      <div className="w-full lg:w-1/2 flex flex-col relative bg-white">
        
        {/* Top bar with back button */}
        <div className="absolute top-6 left-6 md:top-8 md:left-8 z-10">
          <button
            type="button"
            onClick={() => onBack ? onBack() : window.history.back()}
            className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-blue-700 bg-white hover:bg-blue-50 rounded-full shadow-sm border border-gray-100 transition-all duration-300 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Quay lại</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 mt-12 lg:mt-0">
          <div className="w-full max-w-md animate-fade-in">
            {/* Mobile Logo & Title */}
            <div className="text-center mb-8 lg:mb-10">
              <img 
                src={logoImage} 
                alt="Group 3 .NET Tech" 
                className="h-16 mx-auto mb-4 object-contain lg:hidden" 
              />
              <h1 className="text-3xl font-bold text-blue-950 mb-2">
                {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
              </h1>
              <p className="text-gray-500">
                {isLogin ? 'Đăng nhập để tiếp tục lộ trình học tập' : 'Bắt đầu hành trình chinh phục bằng lái ngay hôm nay'}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-start gap-3 animate-fade-in">
                <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Tab Switch */}
            <div className="flex gap-2 mb-8 bg-gray-50 p-1 rounded-xl">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 ${
                  isLogin
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <LogIn size={18} />
                  <span>Đăng nhập</span>
                </div>
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 ${
                  !isLogin
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <UserPlus size={18} />
                  <span>Đăng ký</span>
                </div>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Tên đăng nhập */}
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isLogin ? 'Tên đăng nhập' : 'Tên tài khoản (Username)'}
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={isLogin ? 'Nhập tên đăng nhập' : 'Nhập tên tài khoản để đăng ký'}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-gray-900"
                    required
                  />
                </div>
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Nhập mật khẩu"
                    className="w-full pl-11 pr-11 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-gray-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-gray-900"
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
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3.5 px-4 rounded-xl font-bold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 mt-2"
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

            {/* Social login removed */}

            {/* Additional Info */}
            <div className="mt-8 text-center text-sm text-gray-600">
              {isLogin ? (
                <p>
                  Chưa có tài khoản?{' '}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-blue-700 font-bold hover:text-blue-800 hover:underline transition-colors"
                  >
                    Đăng ký ngay
                  </button>
                </p>
              ) : (
                <p>
                  Đã có tài khoản?{' '}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="text-blue-700 font-bold hover:text-blue-800 hover:underline transition-colors"
                  >
                    Đăng nhập ngay
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="w-full text-center text-xs text-gray-500 py-6 mt-auto">
          Bằng việc đăng nhập, bạn đồng ý với{' '}
          <a href="#" className="font-medium text-gray-700 hover:text-blue-700 transition-colors">Điều khoản sử dụng</a>
          {' '}và{' '}
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onNavigateToPrivacy?.();
            }}
            className="font-medium text-gray-700 hover:text-blue-700 transition-colors"
          >
            Chính sách bảo mật
          </button>
        </div>
      </div>
    </div>
  );
};
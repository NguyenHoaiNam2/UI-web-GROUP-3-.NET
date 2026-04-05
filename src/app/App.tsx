import React, { useState, useEffect } from 'react';
import { Home, FileText, Facebook, Twitter, Instagram, Mail, LogIn, User as UserIcon, LogOut, CheckSquare, Book, Shield, Info, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import logoImage from '@/assets/logo.svg';
import userAvatar from '@/assets/avatar.svg';
import pageBackground from '@/assets/background-main.png';
import { AuthPage } from '@/app/components/AuthPage';
import { ProfilePage } from '@/app/components/ProfilePage';
import { HistoryPage } from '@/app/components/HistoryPage';
import { ThiPage } from '@/app/components/ThiPage';
import { ReviewPage } from '@/app/components/ReviewPage';
import { ConsultationUserPage } from '@/app/components/ConsultationUserPage';
import { ConsultationAdminPage } from '@/app/components/ConsultationAdminPage';
import { HomePage } from '@/app/components/HomePage';
import { IntroPage } from '@/app/components/IntroPage';
import { PrivacyPolicyPage } from '@/app/components/PrivacyPolicyPage';
import { ContactPage } from '@/app/components/ContactPage';
import { AdminPage } from '@/app/components/AdminPage';
import { DocumentsPage } from '@/app/components/DocumentsPage';
import { Question } from '@/app/types';
import { Chapter, CHAPTERS } from '@/app/types'; // Ensure Chapter and CHAPTERS are imported

import CallPopup from "./components/CallPopup";
import { url } from '../env.js';
import { GlobalCallHandler } from './components/GlobalCallHandler';


// Định nghĩa các trang chính
type PageKey = 'HOME' | 'INTRO' | 'THI' | 'REVIEW' | 'CONSULTATION' | 'DOCS' | 'PROFILE' | 'HISTORY' | 'PRIVACY' | 'CONTACT' | 'ADMIN';

const PAGES: Record<PageKey, string> = {
  HOME: 'Trang Chủ',
  INTRO: 'Giới thiệu',
  THI: 'Thi Sát Hạch',
  REVIEW: 'Ôn Tập',
  CONSULTATION: 'Trao Đổi Trực Tiếp',
  DOCS: 'Tài liệu',
  PROFILE: 'Hồ sơ',
  HISTORY: 'Lịch sử',
  PRIVACY: 'Chính sách bảo mật',
  CONTACT: 'Liên hệ & Góp ý',
  ADMIN: 'Quản trị hệ thống',
};

const App = () => {

  //Quản lý popup video call
  const [showCall, setShowCall] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  // State for mobile menu
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  // State quản lý đăng nhập
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'USER' | 'ADMIN' | null>(null);
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [userData, setUserData] = useState<{ name: string; email: string }>({
    name: 'Khách',
    email: ''
  });

  const [currentPage, setCurrentPage] = useState<PageKey>(() => {
    try {
      if (typeof window !== 'undefined') {
        // Prefer the current pathname (useful when user navigates directly to /admin)
        const path = window.location.pathname || '/';
        if (path === '/admin') return 'ADMIN';
        if (path.startsWith('/intro') || path.startsWith('/gioi-thieu')) return 'INTRO';
        if (path.startsWith('/docs')) return 'DOCS';
        if (path.startsWith('/thi')) return 'THI';
        if (path.startsWith('/review')) return 'REVIEW';
        if (path.startsWith('/consultation')) return 'CONSULTATION';
        if (path.startsWith('/profile')) return 'PROFILE';
        if (path.startsWith('/history')) return 'HISTORY';
        if (path.startsWith('/privacy')) return 'PRIVACY';
        if (path.startsWith('/contact')) return 'CONTACT';

        // Fall back to saved page in localStorage
        const saved = window.localStorage.getItem('currentPage') as PageKey | null;
        const validKeys: PageKey[] = ['HOME', 'INTRO', 'THI', 'REVIEW', 'DOCS', 'PROFILE', 'HISTORY', 'PRIVACY', 'CONTACT', 'ADMIN'];
        if (saved && validKeys.includes(saved)) return saved;
      }
    } catch (err) {
      // ignore
    }
    return 'HOME';
  });
  const [resetKey, setResetKey] = useState(0);

  // Database questions state (persisted to localStorage)
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('questions') : null;
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Question[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Failed to load questions from localStorage', err);
      return [];
    }
  });
  // Load session on startup: restore token, role and user profile (if available)
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const role = localStorage.getItem('userRole');
        let storedName = localStorage.getItem('userName');
        let storedEmail = localStorage.getItem('userEmail');

        if (storedName === 'undefined') storedName = null;
        if (storedEmail === 'undefined') storedEmail = null;

        if (token && role) {
          setIsAuthenticated(true);
          setUserRole(role as 'USER' | 'ADMIN');

          // If profile not stored locally try to fetch it from API
          if (!storedName && token) {
            try {
              const res = await fetch(url + 'auth/me', {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res && res.ok) {
                const profile = await res.json();
                storedName = profile?.name ?? profile?.username ?? storedName;
                storedEmail = profile?.email ?? storedEmail;
                try {
                  if (storedName && storedName !== 'undefined') localStorage.setItem('userName', storedName);
                  if (storedEmail && storedEmail !== 'undefined') localStorage.setItem('userEmail', storedEmail);
                } catch (e) { }
              }
            } catch (e) {
              // ignore fetch errors
            }
          }

          // restore user profile if present
          if (storedName || storedEmail) {
            setUserData({ name: storedName ?? 'Khách', email: storedEmail ?? '' });
          }
          setShowAuthPage(false);
        } else {
          // Nếu không có token/đã đăng xuất => hiển thị trang đăng nhập
          setIsAuthenticated(false);
          setUserRole(null);
          setUserData({ name: 'Khách', email: '' });
          setShowAuthPage(false);
        }
      } catch (err) {
        // ignore and show auth
        setIsAuthenticated(false);
        setShowAuthPage(false);
      }
    };

    init();
  }, []);
  // Persist questions to localStorage whenever they change
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('questions', JSON.stringify(questions));
      }
    } catch (err) {
      console.error('Failed to save questions to localStorage', err);
    }
  }, [questions]);

  // Chapters state (try to load from localStorage or fallback to built-in CHAPTERS)
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('chapters') : null;
      if (!raw) return CHAPTERS;
      const parsed = JSON.parse(raw) as Chapter[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : CHAPTERS;
    } catch (err) {
      return CHAPTERS;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('chapters', JSON.stringify(chapters));
    } catch { }
  }, [chapters]);

  // Fetch questions from the new API and merge them into local state.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fetchAll = async () => {
      try {
        console.log('Fetching questions from API:', url + 'api/CauHoi');
        // Fetch using the new API format
        const res = await fetch(url + 'api/CauHoi'); // Assuming API is running on this backend URL for now
        let dataQ: any[] = [];

        if (res && res.ok) {
          const rawData = await res.json();
          console.log('API Raw Data:', rawData);
          // Extract the array from the paginated response object (rawData.questions)
          dataQ = Array.isArray(rawData) ? rawData : (rawData.questions || rawData.data || rawData.items || []);
        } else {
          console.error('API Error Response:', res.status, res.statusText);
        }

        if (!Array.isArray(dataQ) || dataQ.length === 0) {
          console.warn('No questions found or data is not an array.');
          return;
        }

        console.log('Mapping', dataQ.length, 'questions...');
        const mapped: Question[] = dataQ.map((q: any) => {
          const options = Array.isArray(q.answers) ? q.answers.map((a: any) => a?.answerContent ?? String(a)) : [];
          let correctIndex = 0;
          if (Array.isArray(q.answers)) {
            const idx = q.answers.findIndex((a: any) => a && a.isCorrect === true);
            if (idx !== -1) correctIndex = idx;
          }

          let chapterId = 1;
          if (Array.isArray(q.categories) && q.categories.length > 0) {
            chapterId = Number(q.categories[0]);
          }

          return {
            id: `api-${String(q.id)}`,
            content: q.questionContent ?? '',
            options,
            correctAnswer: Math.max(0, Math.min(correctIndex, options.length - 1)),
            chapterId,
            isParalysis: !!q.isCritical,
            imageUrl: q.imageUrl ?? '',
            explanation: q.explanation ?? '',
          } as Question;
        });

        setQuestions(prev => {
          const byId = new Map(prev.map(p => [p.id, p]));
          for (const mq of mapped) byId.set(mq.id, mq);
          const merged = Array.from(byId.values());
          try { window.localStorage.setItem('questions', JSON.stringify(merged)); } catch { }
          return merged;
        });
      } catch (err) {
        console.warn('Failed to fetch questions from new API', err);
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Cross-tab / cross-window sync: broadcast changes and listen for updates
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Keep a ref of latest questions to compare inside handlers
    const bcSupported = typeof (window as any).BroadcastChannel !== 'undefined';
    const bc = bcSupported ? new BroadcastChannel('app-questions') : null;

    // On questions change we already write localStorage above; also broadcast to other contexts
    const postBroadcast = (data: Question[]) => {
      try {
        if (bc) bc.postMessage({ type: 'questions-update', data });
      } catch (e) {
        // ignore
      }
    };

    // install storage listener
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'questions') return;
      try {
        if (!e.newValue) {
          setQuestions([]);
          return;
        }
        const parsed = JSON.parse(e.newValue) as Question[];
        // Compare stringified to avoid unnecessary set (and avoid loop)
        const current = JSON.stringify(questions);
        const incoming = JSON.stringify(parsed);
        if (current !== incoming) setQuestions(parsed);
      } catch (err) {
        console.warn('Failed to parse questions from storage event', err);
      }
    };

    window.addEventListener('storage', onStorage);

    if (bc) {
      bc.onmessage = (ev: MessageEvent) => {
        try {
          const msg = ev.data;
          if (msg?.type === 'questions-update') {
            const incoming = JSON.stringify(msg.data || []);
            const current = JSON.stringify(questions);
            if (current !== incoming) setQuestions(msg.data || []);
          }
        } catch (err) {
          console.warn('Failed to handle bc message', err);
        }
      };
    }

    // Broadcast current questions once on mount to help other contexts sync
    postBroadcast(questions);

    return () => {
      window.removeEventListener('storage', onStorage);
      if (bc) {
        try { bc.close(); } catch (_) { }
      }
    };
    // We intentionally depend on `questions` so listeners can compare against latest via closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* no deps here to register once */]);

  // Hàm xử lý chuyển trang chính
  const handlePageChange = (page: PageKey) => {
    if (currentPage === page) {
      // Nếu đang ở trang hiện tại và ấn lại vào menu -> force reset bằng cách đổi key
      setResetKey(prev => prev + 1);
    } else {
      setCurrentPage(page);
    }
    // persist and update URL so reload keeps current page
    try {
      if (typeof window !== 'undefined') {
        const pathMap: Record<PageKey, string> = {
          HOME: '/', INTRO: '/intro', THI: '/thi', REVIEW: '/review', CONSULTATION: '/consultation', DOCS: '/docs', PROFILE: '/profile', HISTORY: '/history', PRIVACY: '/privacy', CONTACT: '/contact', ADMIN: '/admin'
        };
        const newPath = pathMap[page] || '/';
        window.history.replaceState(null, '', newPath);
        window.localStorage.setItem('currentPage', page);
      }
    } catch (err) {
      // ignore
    }
  };

  // Keep localStorage in sync if page changed by other means
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('currentPage', currentPage);
    } catch { }
  }, [currentPage]);

  // Hàm xử lý đăng nhập
  const handleLogin = (user: { name: string; email: string; role: 'USER' | 'ADMIN' }) => {
    setIsAuthenticated(true);
    // Prevents setting literal "undefined" string if backend fields mismatch
    const validName = user.name && user.name !== 'undefined' ? user.name : 'Người dùng';
    const validUser = { ...user, name: validName };
    setUserData(validUser);
    setUserRole(validUser.role);
    // persist basic profile so reload / direct-url keeps the name
    try {
      localStorage.setItem('userName', validUser.name);
      localStorage.setItem('userEmail', validUser.email);
      localStorage.setItem('userRole', validUser.role);
    } catch (e) { }
    setShowAuthPage(false);
  };

  // Hàm hiển thị trang đăng nhập
  const handleShowAuthPage = () => {
    setShowAuthPage(true);
  };

  // Hàm đăng xuất
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
    } catch (e) { }
    setUserData({ name: 'Khách', email: '' });
    setCurrentPage('HOME');
    setShowAuthPage(true);
  };

  // Nếu chưa đăng nhập và đang hiển thị trang Auth
  if (!isAuthenticated && showAuthPage) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full h-full"
        >
          <AuthPage
            onLogin={handleLogin}
            onNavigateToPrivacy={() => {
              setShowAuthPage(false);
              handlePageChange('PRIVACY');
            }}
            onBack={() => setShowAuthPage(false)}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // (Admin login removed) allow AdminPage to be rendered directly via currentPage = 'ADMIN'

  const renderContent = () => {
    switch (currentPage) {
      case 'HOME':
        return (
          <HomePage
            onNavigateToThi={() => handlePageChange('THI')}
            onNavigateToDocs={() => handlePageChange('DOCS')}
          />
        );
      case 'THI':
        return (
          <ThiPage
            isAuthenticated={isAuthenticated}
            onShowAuth={handleShowAuthPage}
            onNavigateHistory={() => handlePageChange('HISTORY')}
            questions={questions}
            chapters={chapters}
          />
        );
      case 'INTRO':
        return (
          <IntroPage
            onNavigateToThi={() => handlePageChange('THI')}
            onNavigateToDocs={() => handlePageChange('DOCS')}
          />
        );
      case 'REVIEW':
        return <ReviewPage questions={questions} />;
      case 'CONSULTATION':
        if (!isAuthenticated) {
          // return (
          //   <div className="flex items-center justify-center h-full">
          //     <button onClick={handleShowAuthPage}>
          //       Vui lòng đăng nhập để dùng chức năng này.
          //     </button>
          //   </div>
          // );
          return <ConsultationUserPage setShowCall={setShowCall} />;
        }
        if (userRole === 'ADMIN') {
          return <ConsultationAdminPage
            setShowCall={setShowCall} />;
        }
        return (
          <ConsultationUserPage
            setShowCall={setShowCall}   // chỉ cần mở popup
          />
        );
      case 'PROFILE':
        if (isAuthenticated) {
          return (
            <ProfilePage
              userName={userData.name}
              userEmail={userData.email}
              onBackToHome={() => handlePageChange('HOME')}
            />
          );
        }
        return null;
      case 'HISTORY':
        if (isAuthenticated) {
          return (
            <HistoryPage
              userName={userData.name}
              onBackToHome={() => handlePageChange('THI')}
            />
          );
        }
        return null;
      case 'PRIVACY':
        return (
          <PrivacyPolicyPage
            onBackToHome={() => handlePageChange('HOME')}
          />
        );
      case 'CONTACT':
        return (
          <ContactPage
            onBackToHome={() => handlePageChange('HOME')}
          />
        );
      case 'ADMIN':
        return <AdminPage questions={questions} setQuestions={setQuestions} chapters={chapters} />;
      case 'DOCS':
        return <DocumentsPage />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-white min-h-[600px]">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-blue-500 mb-4">
                {PAGES[currentPage]}
              </h1>
              <p className="text-gray-500">Nội dung đang được cập nhật...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col font-sans text-gray-800 overflow-x-hidden"
      style={{
        backgroundImage: `url(${pageBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: '#060066',
      }}
    >
      {/* Navbar */}
      <nav className="w-full bg-blue-50 px-4 md:px-8 py-4 shadow-sm flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div
          className="flex items-center gap-2 md:gap-4 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePageChange('HOME')}
        >
          <img
            src={logoImage}
            alt="Group 3 .NET Tech"
            className="h-10 w-10 md:h-12 md:w-12 object-cover rounded-xl shadow-md border-2 border-white"
          />
          <span className="font-extrabold text-base md:text-xl tracking-tight bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent sm:block">
            GROUP 3 .NET TECH
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <div className="hidden lg:flex items-center gap-2">
            <NavButton
              active={currentPage === 'HOME'}
              onClick={() => handlePageChange('HOME')}
              icon={<Home size={20} />}
              label={PAGES.HOME}
            />
            <NavButton
              active={currentPage === 'INTRO'}
              onClick={() => handlePageChange('INTRO')}
              icon={<Info size={20} />}
              label={PAGES.INTRO}
            />
            <NavButton
              active={currentPage === 'THI'}
              onClick={() => handlePageChange('THI')}
              icon={<CheckSquare size={20} />}
              label={PAGES.THI}
            />
            <NavButton
              active={currentPage === 'REVIEW'}
              onClick={() => handlePageChange('REVIEW')}
              icon={<Book size={20} />}
              label={PAGES.REVIEW}
            />
            <NavButton
              active={currentPage === 'CONSULTATION'}
              onClick={() => handlePageChange('CONSULTATION')}
              icon={<Mail size={20} />}
              label={PAGES.CONSULTATION}
            />
            <NavButton
              active={currentPage === 'DOCS'}
              onClick={() => handlePageChange('DOCS')}
              icon={<FileText size={20} />}
              label={PAGES.DOCS}
            />
          </div>

          <div className="lg:hidden flex items-center justify-center relative">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
            <AnimatePresence>
              {showMobileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-14 right-0 w-64 bg-white rounded-xl shadow-xl border border-blue-100 p-2 flex flex-col gap-1 z-50 origin-top-right"
                >
                  <NavButtonMobile active={currentPage === 'HOME'} onClick={() => { handlePageChange('HOME'); setShowMobileMenu(false); }} icon={<Home size={20} />} label={PAGES.HOME} />
                  <NavButtonMobile active={currentPage === 'INTRO'} onClick={() => { handlePageChange('INTRO'); setShowMobileMenu(false); }} icon={<Info size={20} />} label={PAGES.INTRO} />
                  <NavButtonMobile active={currentPage === 'THI'} onClick={() => { handlePageChange('THI'); setShowMobileMenu(false); }} icon={<CheckSquare size={20} />} label={PAGES.THI} />
                  <NavButtonMobile active={currentPage === 'REVIEW'} onClick={() => { handlePageChange('REVIEW'); setShowMobileMenu(false); }} icon={<Book size={20} />} label={PAGES.REVIEW} />
                  <NavButtonMobile active={currentPage === 'CONSULTATION'} onClick={() => { handlePageChange('CONSULTATION'); setShowMobileMenu(false); }} icon={<Mail size={20} />} label={PAGES.CONSULTATION} />
                  <NavButtonMobile active={currentPage === 'DOCS'} onClick={() => { handlePageChange('DOCS'); setShowMobileMenu(false); }} icon={<FileText size={20} />} label={PAGES.DOCS} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-8 w-[1px] bg-blue-200 mx-2 hidden md:block"></div>

          <div className="flex items-center gap-2 cursor-pointer relative group">
            <div className="relative">
              <img
                src={userAvatar}
                alt="User Avatar"
                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-white shadow-md group-hover:border-blue-200 transition-colors"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            {/* User Dropdown */}
            <div className="absolute top-full right-0 pt-2 hidden group-hover:block w-56 md:w-64 z-50 origin-top-right">
              {isAuthenticated ? (
                // Dropdown khi đã đăng nhập
                <div className="bg-white rounded-xl shadow-xl border border-blue-100 p-4 animate-fade-in flex flex-col gap-3">
                  <div className="text-center pb-3 border-b border-gray-200">
                    <p className="font-bold text-gray-900">{userData.name}</p>
                    {userData.email && <p className="text-sm text-gray-500">{userData.email}</p>}
                  </div>
                  {/* Admin access removed from UI — use /admin path to access admin area */}
                  <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                    onClick={() => handlePageChange('PROFILE')}
                  >
                    <UserIcon size={18} />
                    <span>Xem Profile</span>
                  </button>
                  <button
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                // Dropdown khi chưa đăng nhập
                <div className="bg-white rounded-xl shadow-xl border border-blue-100 p-4 animate-fade-in flex flex-col items-center gap-3">
                  <p className="text-gray-600 font-medium text-sm">Bạn chưa đăng nhập?</p>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm" onClick={handleShowAuthPage}>
                    <LogIn size={18} />
                    <span>Đăng nhập ngay</span>
                  </button>
                  <div className="text-xs text-gray-400 text-center">
                    Truy cập để lưu kết quả thi và tiến độ học tập
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with Transition */}
      <main className="flex-1 flex flex-col relative w-full overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage + resetKey} // Change key to trigger animation
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex-1 flex flex-col w-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {showCall && (
        <CallPopup
          onClose={() => setShowCall(false)}
          isMinimized={isMinimized}
          setIsMinimized={setIsMinimized}
        />
      )}
      <GlobalCallHandler />
      {/* Footer removed - app uses full-height content */}
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}

const NavButton = ({ active, onClick, label, icon }: NavButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
        ${active
          ? 'bg-blue-100 text-blue-600 font-semibold shadow-sm'
          : 'text-gray-500 hover:text-blue-400 hover:bg-blue-50/50'
        }
      `}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
};
const NavButtonMobile = ({ active, onClick, label, icon }: NavButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-300 text-left
        ${active
          ? 'bg-blue-50 text-blue-600 font-semibold'
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50'
        }
      `}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};
const SocialIcon = ({ icon }: { icon: React.ReactNode }) => (
  <a href="#" className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-sm hover:bg-blue-600 hover:text-white transition-all duration-300">
    {icon}
  </a>
);

export default App;
import React, { useState, useEffect } from 'react';
import { Home, FileText, Facebook, Twitter, Instagram, Mail, LogIn, User as UserIcon, LogOut, CheckSquare, Book, Shield, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import logoImage from '@/assets/logo.svg';
import userAvatar from '@/assets/avatar.svg';
import pageBackground from '@/assets/background-main.png';
import { AuthPage } from '@/app/components/AuthPage';
import { AdminLogin } from '@/app/components/AdminLogin';
import { ProfilePage } from '@/app/components/ProfilePage';
import { HistoryPage } from '@/app/components/HistoryPage';
import { ThiPage } from '@/app/components/ThiPage';
import { ReviewPage } from '@/app/components/ReviewPage';
import { HomePage } from '@/app/components/HomePage';
import { IntroPage } from '@/app/components/IntroPage';
import { PrivacyPolicyPage } from '@/app/components/PrivacyPolicyPage';
import { ContactPage } from '@/app/components/ContactPage';
import { AdminPage } from '@/app/components/AdminPage';
import { DocumentsPage } from '@/app/components/DocumentsPage';
import { Question } from '@/app/types';
import { Chapter, CHAPTERS } from '@/app/types'; // Ensure Chapter and CHAPTERS are imported

// Định nghĩa các trang chính
type PageKey = 'HOME' | 'INTRO' | 'THI' | 'REVIEW' | 'DOCS' | 'PROFILE' | 'HISTORY' | 'PRIVACY' | 'CONTACT' | 'ADMIN';

const PAGES: Record<PageKey, string> = {
  HOME: 'Trang Chủ',
  INTRO: 'Giới thiệu',
  THI: 'Thi Sát Hạch',
  REVIEW: 'Ôn Tập',
  DOCS: 'Tài liệu',
  PROFILE: 'Hồ sơ',
  HISTORY: 'Lịch sử',
  PRIVACY: 'Chính sách bảo mật',
  CONTACT: 'Liên hệ & Góp ý',
  ADMIN: 'Quản trị hệ thống',
};

const App = () => {
  // State quản lý đăng nhập
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [userData, setUserData] = useState<{ name: string; email: string }>({
    name: 'Khách',
    email: ''
  });
  
  const [currentPage, setCurrentPage] = useState<PageKey>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = window.localStorage.getItem('currentPage') as PageKey | null;
        const validKeys: PageKey[] = ['HOME','INTRO','THI','REVIEW','DOCS','PROFILE','HISTORY','PRIVACY','CONTACT','ADMIN'];
        if (saved && validKeys.includes(saved)) return saved;
        const path = window.location.pathname || '/';
        if (path === '/admin') return 'ADMIN';
        if (path.startsWith('/intro') || path.startsWith('/gioi-thieu')) return 'INTRO';
        if (path.startsWith('/docs')) return 'DOCS';
        if (path.startsWith('/thi')) return 'THI';
        if (path.startsWith('/review')) return 'REVIEW';
        if (path.startsWith('/profile')) return 'PROFILE';
        if (path.startsWith('/history')) return 'HISTORY';
        if (path.startsWith('/privacy')) return 'PRIVACY';
        if (path.startsWith('/contact')) return 'CONTACT';
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
    } catch {}
  }, [chapters]);

  // On first load, fetch questions and chapters from remote API and merge into local state.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fetchAll = async () => {
      try {
        const [resQ, resCh] = await Promise.all([
          fetch('http://localhost:3000/api/questions'),
          fetch('http://localhost:3000/api/chapters')
        ]);

        let dataQ: any[] = [];
        let dataCh: any[] = [];

        if (resCh && resCh.ok) {
          try { dataCh = await resCh.json(); } catch {}
        }

        if (resQ && resQ.ok) {
          try { dataQ = await resQ.json(); } catch {}
        }

        // Map chapters if provided
        // NOTE: API chapters are 0-based; convert to 1-based ids for UI consistency (UI chapters 1..N)
        let fetchedChapters = CHAPTERS;
        if (Array.isArray(dataCh) && dataCh.length > 0) {
          fetchedChapters = dataCh.map((c: any) => ({ id: Number(c.id) + 1, title: c.title ?? `Chương ${c.id}`, description: c.description ?? '', questionIds: Array.isArray(c.questionIds) ? c.questionIds.map((n: any) => Number(n)) : undefined }));
          setChapters(fetchedChapters);
        }

        if (!Array.isArray(dataQ) || dataQ.length === 0) return;

        // Build map from question numeric id -> chapter id (1-based) using fetchedChapters.questionIds
        const qToChap = new Map<number, number>();
        for (const ch of fetchedChapters) {
          if (Array.isArray(ch.questionIds)) {
            for (const qid of ch.questionIds) {
              qToChap.set(Number(qid), ch.id);
            }
          }
        }

        const mapped: Question[] = dataQ.map((q: any) => {
          const options = Array.isArray(q.answers) ? q.answers.map((a: any) => a?.text ?? String(a)) : (q.options ?? []);
          let correctIndex = 0;
          if (Array.isArray(q.answers)) {
            const idx = q.answers.findIndex((a: any) => a && (a.correct === true || a.isCorrect === true));
            if (idx !== -1) correctIndex = idx;
          } else if (typeof q.correct === 'number') {
            correctIndex = q.correct;
          } else if (typeof q.correctAnswer === 'number') {
            correctIndex = q.correctAnswer;
          }

          // Prefer explicit categoryIds from question (API likely 0-based so shift +1), otherwise use chapter mapping from chapters API
          let chapterId = 1;
          if (Array.isArray(q.categoryIds) && q.categoryIds.length > 0) chapterId = Number(q.categoryIds[0]) + 1;
          else if (qToChap.has(Number(q.id))) chapterId = qToChap.get(Number(q.id)) as number;

          return {
            id: `api-${String(q.id)}`,
            content: q.question ?? q.content ?? '',
            options,
            correctAnswer: Math.max(0, Math.min(correctIndex, options.length - 1)),
            chapterId,
            isParalysis: !!q.isParalysis,
            imageUrl: q.hinhanhqAlt ?? q.imageUrl,
            explanation: q.explanation ?? '',
            optionExplanations: q.optionExplanations ?? undefined,
          } as Question;
        });

        setQuestions(prev => {
          const byId = new Map(prev.map(p => [p.id, p]));
          for (const mq of mapped) byId.set(mq.id, mq);
          const merged = Array.from(byId.values());
          try { window.localStorage.setItem('questions', JSON.stringify(merged)); } catch {}
          return merged;
        });
      } catch (err) {
        console.warn('Failed to fetch questions/chapters from API', err);
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
        try { bc.close(); } catch (_) {}
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
          HOME: '/', INTRO: '/intro', THI: '/thi', REVIEW: '/review', DOCS: '/docs', PROFILE: '/profile', HISTORY: '/history', PRIVACY: '/privacy', CONTACT: '/contact', ADMIN: '/admin'
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
    } catch {}
  }, [currentPage]);

  // Hàm xử lý đăng nhập
  const handleLogin = (user: { name: string; email: string }) => {
    setIsAuthenticated(true);
    setUserData(user);
    setShowAuthPage(false);
  };

  // Hàm hiển thị trang đăng nhập
  const handleShowAuthPage = () => {
    setShowAuthPage(true);
  };

  // Hàm đăng xuất
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserData({ name: 'Khách', email: '' });
    setCurrentPage('HOME');
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
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // If user navigates directly to /admin, render admin login wrapper
  if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
    return <AdminLogin questions={questions} setQuestions={setQuestions} />;
  }

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
      <nav className="w-full bg-blue-50 px-8 py-4 shadow-sm flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div 
          className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handlePageChange('HOME')}
        >
           <img 
             src={logoImage} 
             alt="Group 3 .NET Tech" 
             className="h-12 w-12 object-cover rounded-xl shadow-md border-2 border-white" 
           />
           <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent hidden sm:block">
             GROUP 3 .NET TECH
           </span>
        </div>

        <div className="flex items-center gap-6">
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
              active={currentPage === 'DOCS'} 
              onClick={() => handlePageChange('DOCS')}
              icon={<FileText size={20} />}
              label={PAGES.DOCS}
            />
          </div>

          {/* Mobile Menu Button - simplified placeholder */}
          <div className="lg:hidden">
             {/* You might want a mobile menu here later */}
          </div>

          <div className="h-8 w-[1px] bg-blue-200 mx-2 hidden md:block"></div>

          <div className="flex items-center gap-3 cursor-pointer group relative">
            <div className="relative">
              <img 
                src={userAvatar}
                alt="User Avatar"
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md group-hover:border-blue-200 transition-colors"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            {/* User Dropdown */}
            <div className="absolute top-full right-0 pt-2 hidden group-hover:block w-64 z-50">
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
      <main className="flex-1 flex flex-col relative w-full overflow-hidden">
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

      {/* Footer */}
      <footer className="bg-blue-50 pt-10 pb-6 border-t border-blue-100">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <img src={logoImage} alt="Group 3 .NET Tech" className="h-10 w-10 object-cover rounded-xl" />
                <span className="font-bold text-lg text-blue-900">GROUP 3 .NET TECH</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Nền tảng học tập và ôn thi trực tuyến hàng đầu, giúp bạn chinh phục mọi thử thách kiến thức một cách dễ dàng và hiệu quả.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-blue-800 mb-4 uppercase text-sm tracking-wider">Liên kết nhanh</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><button onClick={() => handlePageChange('HOME')} className="hover:text-blue-500 transition-colors">Trang Chủ</button></li>
                <li><button onClick={() => handlePageChange('DOCS')} className="hover:text-blue-500 transition-colors">Tài Liệu Học Tập</button></li>
                <li><button onClick={() => handlePageChange('THI')} className="hover:text-blue-500 transition-colors">Thi Sát Hạch</button></li>
                <li><button onClick={() => handlePageChange('REVIEW')} className="hover:text-blue-500 transition-colors">Ôn Tập</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-blue-800 mb-4 uppercase text-sm tracking-wider">Hỗ trợ</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><a href="#" className="hover:text-blue-500 transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Điều khoản sử dụng</a></li>
                <li><button onClick={() => handlePageChange('PRIVACY')} className="hover:text-blue-500 transition-colors">Chính sách bảo mật</button></li>
                <li><button onClick={() => handlePageChange('CONTACT')} className="hover:text-blue-500 transition-colors">Liên hệ góp ý</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-blue-800 mb-4 uppercase text-sm tracking-wider">Kết nối</h3>
              <div className="flex items-center gap-2 mb-4 text-gray-600 text-sm">
                 <Mail size={16} />
                 <span>contact@myweb.com</span>
              </div>
              <div className="flex gap-4">
                <SocialIcon icon={<Facebook size={18} />} />
                <SocialIcon icon={<Twitter size={18} />} />
                <SocialIcon icon={<Instagram size={18} />} />
              </div>
            </div>
          </div>
          
          <div className="border-t border-blue-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© 2024 MyWeb. Bản quyền thuộc về chúng tôi.</p>
            <p>Được thiết kế với ❤️ và ☕</p>
          </div>
        </div>
      </footer>
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

const SocialIcon = ({ icon }: { icon: React.ReactNode }) => (
  <a href="#" className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-sm hover:bg-blue-600 hover:text-white transition-all duration-300">
    {icon}
  </a>
);

export default App;
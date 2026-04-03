import React, { useState, useEffect } from 'react';
import { PlayCircle, ArrowLeft, Car, Truck, Bike, History, Star, AlertCircle } from 'lucide-react';
import { QuizGame } from './QuizGame';
import { toast } from 'sonner';
import { Question, Chapter } from '@/app/types';
import { url } from '../../env.js';

// Danh sách các bằng lái
const LICENSE_TYPES = [
  {
    code: "B1",
    name: "Hạng B1",
    description: "Ô tô số tự động, không kinh doanh (cá nhân, gia đình)",
    color: "text-green-500",
    bg: "bg-green-50",
    border: "border-green-200",
    stats: "30 câu / 20 phút",
    colSpan: "md:col-span-3"
  },
  {
    code: "B2",
    name: "Hạng B2",
    description: "Ô tô số sàn, kinh doanh vận tải (taxi, giao hàng…)",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    stats: "35 câu / 22 phút",
    colSpan: "md:col-span-3"
  },
  {
    code: "C",
    name: "Hạng C",
    description: "Ô tô tải và chuyên dùng (trên 3,5 tấn)",
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
    stats: "40 câu / 24 phút",
    colSpan: "md:col-span-2"
  },
  {
    code: "D",
    name: "Hạng D",
    description: "Ô tô chở người từ 10–30 chỗ",
    color: "text-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-200",
    stats: "45 câu / 26 phút",
    colSpan: "md:col-span-2"
  },
  {
    code: "E",
    name: "Hạng E",
    description: "Ô tô chở người trên 30 chỗ",
    color: "text-rose-500",
    bg: "bg-rose-50",
    border: "border-rose-200",
    stats: "45 câu / 26 phút",
    colSpan: "md:col-span-2"
  }
];


interface ThiPageProps {
  isAuthenticated: boolean;
  onShowAuth: () => void;
  onNavigateHistory: () => void;
  questions: Question[];
  chapters?: Chapter[];
  retakeQuestions?: Question[] | null;
  retakeExamTitle?: string | null;
  onConsumeRetake?: () => void;
}

export const ThiPage: React.FC<ThiPageProps> = ({ isAuthenticated, onShowAuth, onNavigateHistory, questions: allQuestions, chapters: propChapters, retakeQuestions, retakeExamTitle, onConsumeRetake }) => {
  // State: null = chưa chọn đề, object = đang làm bài thi (hoặc xem chi tiết đề)
  const [selectedExam, setSelectedExam] = useState<{title: string, topic: string} | null>(null);
  
  // Selected questions for the current exam
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [examConfig, setExamConfig] = useState<{timeSeconds?: number; passCount?: number; paralysisMandatory?: boolean} | null>(null);

  useEffect(() => {
    if (retakeQuestions && retakeQuestions.length > 0) {
      setExamQuestions(retakeQuestions);
      setSelectedExam({ title: retakeExamTitle || 'Làm lại câu sai', topic: `Làm lại ${retakeQuestions.length} câu sai` });
      onConsumeRetake?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retakeQuestions]);

  // If user clicked retake from history, initialize examQuestions accordingly
  useEffect(() => {
    // props retakeQuestions handled in caller (App) by passing them; avoid reading window here
  }, []);

  const handleStartExam = (exam: {title: string, topic: string}) => {
    // Simple logic: Take 35 random questions or all if less than 35
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    setExamQuestions(shuffled.slice(0, 35));
    setSelectedExam(exam);
  };

  // Helper: Create and start exam for a specific license
  const handleStartExamByLicense = async (license: typeof LICENSE_TYPES[0]) => {
    try {
      // Thêm đuôi TEST vào mã bằng theo cấu trúc backend mới (VD: C -> CTEST, B1 -> B1TEST)
      const apiCode = license.code + 'TEST'; 
      const res = await fetch(url + 'api/CauHoi/CauTruc?BangLai=' + apiCode);
      
      if (res.ok) {
        let rawData = await res.json();
        console.log("API CauTruc Response cho", apiCode, ":", rawData);
        
        // Đề phòng trường hợp API trả về mảng 1 phần tử bọc lấy object chính (vd: `[{ questions: [...] }]`)
        if (Array.isArray(rawData) && rawData.length === 1 && (rawData[0].questions || rawData[0].cauHois)) {
          rawData = rawData[0];
        }

        let dataQ: any[] = [];
        if (rawData && Array.isArray(rawData.questions)) {
          dataQ = rawData.questions;
        } else if (rawData && Array.isArray(rawData.cauHois)) {
          dataQ = rawData.cauHois;
        } else if (rawData && Array.isArray(rawData.data)) {
          dataQ = rawData.data;
        } else if (rawData && Array.isArray(rawData.items)) {
          dataQ = rawData.items;
        } else if (Array.isArray(rawData)) {
          // Quét và Flatten (làm phẳng) nếu API rải rác mảng lồng nhau
          rawData.forEach((item: any) => {
            if (item && typeof item === 'object' && Array.isArray(item.questions)) dataQ.push(...item.questions);
            else if (item && typeof item === 'object' && Array.isArray(item.cauHois)) dataQ.push(...item.cauHois);
            else dataQ.push(item);
          });
        }
        
        if (dataQ.length > 0) {
          const mapped: Question[] = dataQ.map((q: any) => {
            const options = Array.isArray(q.answers) ? q.answers.map((a: any) => a?.answerContent ?? String(a)) : [];
            let correctIndex = 0;
            if (Array.isArray(q.answers)) {
              const idx = q.answers.findIndex((a: any) => a && a.isCorrect === true);
              if (idx !== -1) correctIndex = idx;
            }

            let chapterId = 1;
            if (Array.isArray(q.categories) && q.categories.length > 0) {
              chapterId = Number(q.categories[0].id || q.categories[0]); // handles object or number
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

          // Determine time and passCount. Dùng dữ liệu từ API nếu có, không thì dùng fallback mặc định.
          let timeSeconds = rawData.duration ? rawData.duration * 60 : 22 * 60;
          let passCount = rawData.questionCount ? Math.floor(rawData.questionCount * 0.9) : 31;
          
          if (!rawData.duration) {
            if (license.code === 'B1') { timeSeconds = 20 * 60; passCount = 27; }
            else if (license.code === 'B2') { timeSeconds = 22 * 60; passCount = 32; }
            else if (license.code === 'C') { timeSeconds = 24 * 60; passCount = 36; }
            else if (['D', 'E', 'F'].includes(license.code)) { timeSeconds = 26 * 60; passCount = 41; }
            else { passCount = Math.floor(mapped.length * 0.9); }
          }

          setExamQuestions(mapped);
          setExamConfig({ timeSeconds, passCount, paralysisMandatory: true });
          setSelectedExam({ 
            title: `${license.code} - Thi Sát Hạch`, 
            topic: `Thời gian: ${timeSeconds/60} phút - ${mapped.length} câu hỏi` 
          });
          return;
        } else {
          console.warn(`API trả về 0 câu hỏi hoặc sai định dạng cho hạng ${license.code}.`);
          toast.warning(`Chưa có đề thi trên hệ thống cho bằng ${license.code}.`);
          
          setExamQuestions([]);
          setExamConfig({ timeSeconds: 22 * 60, passCount: 0, paralysisMandatory: false });
          setSelectedExam({ 
            title: `${license.code} - Thi Sát Hạch`, 
            topic: `Chưa có dữ liệu câu hỏi` 
          });
          return;
        }
      }
    } catch(err) {
      console.error('Failed to fetch structural questions', err);
      toast.error('Lỗi kết nối đến máy chủ lấy đề thi!');
      return;
    }
  };

  const getLicenseIcon = (code: string) => {
    if (code.startsWith('A')) return <Bike size={32} />;
    if (code.startsWith('B')) return <Car size={32} />;
    if (code.startsWith('C') || code.startsWith('F')) return <Truck size={32} />;
    return <Truck size={32} />; // D, E dùng chung icon xe lớn
  };

  // 1. Màn hình chi tiết bài thi (Dashboard Layout)
  if (selectedExam) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-fade-in overflow-hidden">
        {/* Main Header / Topbar */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-700 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedExam(null)}
              className="flex items-center gap-2 text-blue-100 hover:text-white bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-all"
            >
              <ArrowLeft size={18} />
              <span className="font-medium">Thoát</span>
            </button>
            <h1 className="text-xl font-bold text-white hidden md:block">{selectedExam.title}</h1>
          </div>
          <div className="text-blue-100 text-sm">{selectedExam.topic}</div>
        </div>
        
        {/* Quiz Interface */}
        <div className="flex-1 flex w-full">
          <QuizGame 
            examTitle={selectedExam.title} 
            questions={examQuestions}
            onExit={() => setSelectedExam(null)} 
            examConfig={examConfig ?? undefined}
            resultFullPage={true}
          />
        </div>
      </div>
    );
  }

  // 2. Màn hình chính (Trang chủ Thi Sát Hạch)
  return (
  <div className="w-full h-full flex flex-col bg-blue-900/40 backdrop-blur-md animate-fade-in overflow-auto">
      <div className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full mb-10">
        
        {/* Phần 1: Chọn Văn Bằng */}
        <div>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white drop-shadow mb-3">Chọn Văn Bằng</h2>
            <p className="text-white/90 max-w-2xl mx-auto drop-shadow">
              Chọn hạng bằng lái xe bạn đang ôn tập để làm các đề thi sát với thực tế nhất.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {LICENSE_TYPES.map((license) => (
              <button 
                key={license.code}
                onClick={() => handleStartExamByLicense(license)}
                className={`
                  bg-white p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl text-left group
                  ${license.border} hover:border-current flex flex-col justify-between block w-full
                  ${license.colSpan}
                `}
              >
                <div>
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${license.bg} ${license.color} transform group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      {getLicenseIcon(license.code)}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className={`px-3 py-1 rounded-md text-sm font-bold ${license.bg} ${license.color}`}>
                        {license.code}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md whitespace-nowrap">
                        {license.stats}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className={`text-2xl font-bold group-hover:text-current text-gray-900 mb-2`}>
                    {license.name}
                  </h3>
                  
                  <p className="text-gray-500 text-sm md:text-base line-clamp-2 min-h-[2.5rem]">
                    {license.description}
                  </p>
                </div>
                
                <div className="flex items-center text-sm font-bold text-gray-400 group-hover:text-current transition-colors mt-6 pt-4 border-t border-gray-100 w-full">
                  <span>Vào thi ngay</span>
                  <ArrowLeft className="w-5 h-5 ml-2 rotate-180 transition-transform group-hover:translate-x-2" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-10">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-gray-400 font-medium text-sm uppercase tracking-wider">Hoặc</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* Phần 2: Hành động nhanh (Thi thử & Lịch sử) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Card Thi Thử */}
          <button 
            onClick={async () => {
              try {
                const res = await fetch(url + 'api/CauHoi/NgauNhien?SoLuong=30');
                if (res.ok) {
                  let rawData = await res.json();
                  
                  if (Array.isArray(rawData) && rawData.length === 1 && (rawData[0].questions || rawData[0].cauHois)) {
                    rawData = rawData[0];
                  }

                  let dataQ: any[] = [];
                  if (rawData && Array.isArray(rawData.questions)) {
                    dataQ = rawData.questions;
                  } else if (rawData && Array.isArray(rawData.cauHois)) {
                    dataQ = rawData.cauHois;
                  } else if (rawData && Array.isArray(rawData.data)) {
                    dataQ = rawData.data;
                  } else if (rawData && Array.isArray(rawData.items)) {
                    dataQ = rawData.items;
                  } else if (Array.isArray(rawData)) {
                    rawData.forEach((item: any) => {
                      if (item && typeof item === 'object' && Array.isArray(item.questions)) dataQ.push(...item.questions);
                      else if (item && typeof item === 'object' && Array.isArray(item.cauHois)) dataQ.push(...item.cauHois);
                      else dataQ.push(item);
                    });
                  }
                  
                  if (dataQ.length > 0) {
                    const mapped: Question[] = dataQ.map((q: any) => {
                      const options = Array.isArray(q.answers) ? q.answers.map((a: any) => a?.answerContent ?? String(a)) : [];
                      let correctIndex = 0;
                      if (Array.isArray(q.answers)) {
                        const idx = q.answers.findIndex((a: any) => a && a.isCorrect === true);
                        if (idx !== -1) correctIndex = idx;
                      }

                      let chapterId = 1;
                      if (Array.isArray(q.categories) && q.categories.length > 0) {
                        chapterId = Number(q.categories[0].id || q.categories[0]); 
                      }

                      return {
                        id: `api-random-${String(q.id)}`,
                        content: q.questionContent ?? '',
                        options,
                        correctAnswer: Math.max(0, Math.min(correctIndex, options.length - 1)),
                        chapterId,
                        isParalysis: !!q.isCritical,
                        imageUrl: q.imageUrl ?? '',
                        explanation: q.explanation ?? '',
                      } as Question;
                    });

                    let timeSeconds = rawData.duration ? rawData.duration * 60 : 22 * 60;
                    let passCount = rawData.questionCount ? Math.floor(rawData.questionCount * 0.9) : 27;

                    setExamQuestions(mapped);
                    setExamConfig({ timeSeconds, passCount, paralysisMandatory: true });
                    setSelectedExam({ 
                      title: "Thi Thử Ngẫu Nhiên", 
                      topic: `Thời gian: ${timeSeconds/60} phút - ${mapped.length} câu hỏi` 
                    });
                    return;
                  }
                }
              } catch (err) {
                console.error('Failed to fetch random questions from API', err);
              }

              // Fallback nếu API lỗi hoặc không trả về dữ liệu câu hỏi
              const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
              setExamQuestions(shuffled.slice(0, 30));
              setExamConfig({ timeSeconds: 22 * 60, passCount: 27, paralysisMandatory: true });
              setSelectedExam({ 
                title: "Thi Thử Ngẫu Nhiên", 
                topic: "Thời gian: 22 phút - 30 câu hỏi (Sinh tự động)" 
              });
            }}
            className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-8 text-white shadow-lg hover:shadow-blue-500/40 transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group text-left"
          >
            <div className="absolute top-0 right-0 p-8 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
              <PlayCircle size={120} />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
                <PlayCircle size={32} className="text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-2">Thi Thử Ngẫu Nhiên</h3>
              <p className="text-blue-100 text-lg mb-6 max-w-md">
                Làm bài thi được tạo ngẫu nhiên giống như thi thật. Kiểm tra kiến thức tổng quát của bạn.
              </p>
              <div className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl backdrop-blur-sm transition-colors font-semibold">
                Bắt đầu ngay <ArrowLeft className="rotate-180" size={20} />
              </div>
            </div>
          </button>

          {/* Card Lịch Sử */}
          <button 
            onClick={() => {
              if (isAuthenticated) {
                onNavigateHistory();
              } else {
                onShowAuth();
              }
            }}
            className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group text-left"
          >
             <div className="absolute top-0 right-0 p-8 text-gray-100 transform group-hover:scale-110 transition-transform duration-500">
              <History size={120} />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <History size={32} className="text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Lịch Sử Làm Bài</h3>
              <p className="text-gray-600 text-lg mb-6 max-w-md">
                {isAuthenticated 
                  ? "Xem lại kết quả các bài thi bạn đã thực hiện để theo dõi sự tiến bộ." 
                  : "Đăng nhập để lưu lại kết quả thi và theo dõi tiến trình học tập của bạn."}
              </p>
              <div className="inline-flex items-center gap-2 bg-gray-100 group-hover:bg-purple-50 text-gray-700 group-hover:text-purple-700 px-6 py-3 rounded-xl transition-colors font-semibold">
                {isAuthenticated ? "Xem lịch sử" : "Đăng nhập ngay"} <ArrowLeft className="rotate-180" size={20} />
              </div>
            </div>
          </button>
        </div>

        {/* Tips / Info Banner removed per request */}

      </div>

      {/* Small footer with basic info (copied from HomePage) */}
      <footer className="bg-white border-t">
        <div className="container mx-auto px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-gray-700">
            <div className="font-bold text-gray-900">GROUP 3 .NET TECH</div>
            <div>Hotline: <a href="tel:333-88-222-55" className="text-blue-600 hover:underline">333-88-222-55</a></div>
            <div className="text-gray-500">© {new Date().getFullYear()} Nhóm 3. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

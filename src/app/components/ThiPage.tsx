import React, { useState, useEffect } from 'react';
import { PlayCircle, ArrowLeft, Car, Truck, Bike, History, Star, AlertCircle } from 'lucide-react';
import { QuizGame } from './QuizGame';
import { toast } from 'sonner';
import { Question, Chapter } from '@/app/types';

// Danh sách các bằng lái
const LICENSE_TYPES = [
  {
    code: "B1",
    name: "Hạng B1",
    description: "Ô tô số tự động, không kinh doanh (cá nhân, gia đình)",
    color: "text-green-500",
    bg: "bg-green-50",
    border: "border-green-200"
  },
  {
    code: "B2",
    name: "Hạng B2",
    description: "Ô tô số sàn, được kinh doanh vận tải (taxi, grab, giao hàng…)",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200"
  },
  {
    code: "C",
    name: "Hạng C",
    description: "Ô tô tải và ô tô chuyên dùng (trên 3,5 tấn)",
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-200"
  },
  {
    code: "D",
    name: "Hạng D",
    description: "Ô tô chở người từ 10–30 chỗ",
    color: "text-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-200"
  },
  {
    code: "E",
    name: "Hạng E",
    description: "Ô tô chở người trên 30 chỗ",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200"
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
  const handleStartExamByLicense = (license: typeof LICENSE_TYPES[0]) => {
    // Helper: Fisher-Yates shuffle
    const shuffle = <T,>(arr: T[]) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    if (license.code === 'B1') {
      const desired: Record<number, number> = {
        1: 9,
        3: 1,
        4: 1,
        5: 1,
        6: 9,
        7: 9,
      };

      const selected: Question[] = [];
      const usedIds = new Set<string>();
      let needParalysis = true;

      for (const chapStr of Object.keys(desired)) {
        const chap = Number(chapStr);
        const want = desired[chap];
        const pool = shuffle(allQuestions.filter(q => q.chapterId === chap && !usedIds.has(q.id)));

        if (needParalysis) {
          const paralysisIdx = pool.findIndex(q => q.isParalysis);
          if (paralysisIdx !== -1) {
            const pq = pool.splice(paralysisIdx, 1)[0];
            selected.push(pq);
            usedIds.add(pq.id);
            needParalysis = false;
          }
        }

        for (let i = 0; i < want && pool.length > 0; i++) {
          const q = pool.shift()!;
          if (!usedIds.has(q.id)) {
            selected.push(q);
            usedIds.add(q.id);
          } else {
            i--;
          }
        }
      }

      if (needParalysis) {
        const globalPar = allQuestions.find(q => q.isParalysis && !usedIds.has(q.id));
        if (globalPar) {
          const replaceIdx = selected.findIndex(q => !q.isParalysis);
          if (replaceIdx !== -1) {
            usedIds.delete(selected[replaceIdx].id);
            selected[replaceIdx] = globalPar;
            usedIds.add(globalPar.id);
            needParalysis = false;
          } else {
            selected.push(globalPar);
            usedIds.add(globalPar.id);
            needParalysis = false;
          }
        }
      }

      const shortages: number[] = [];
      for (const chapStr of Object.keys(desired)) {
        const chap = Number(chapStr);
        const got = selected.filter(q => q.chapterId === chap).length;
        if (got < desired[chap]) shortages.push(chap);
      }

      if (shortages.length > 0) {
        const chapNames = shortages.map(c => `Chương ${c}`).join(', ');
        toast.warning(`Không đủ câu cho: ${chapNames}. Đề sẽ có ${selected.length} câu.`);
      }

      let finalSelected = selected.slice(0, 30);

      const paralysisCount = finalSelected.filter(q => q.isParalysis).length;
      if (paralysisCount === 0) {
        const globalPar2 = allQuestions.find(q => q.isParalysis && !finalSelected.some(f => f.id === q.id));
        if (globalPar2) {
          const replaceIdx = finalSelected.findIndex(q => !q.isParalysis);
          if (replaceIdx !== -1) finalSelected[replaceIdx] = globalPar2;
        }
      } else if (paralysisCount > 1) {
        let keepOne = false;
        for (let i = finalSelected.length - 1; i >= 0; i--) {
          if (finalSelected[i].isParalysis) {
            if (!keepOne) {
              keepOne = true;
              continue;
            }
            const replacement = allQuestions.find(q => !q.isParalysis && !finalSelected.some(f => f.id === q.id));
            if (replacement) finalSelected[i] = replacement;
          }
        }
      }

      finalSelected = shuffle(finalSelected);

      setExamQuestions(finalSelected);
      setExamConfig({ timeSeconds: 20 * 60, passCount: 27, paralysisMandatory: true });
      setSelectedExam({ 
        title: `${license.code} - Thi Sát Hạch`, 
        topic: `Thời gian: 20 phút - 30 câu hỏi` 
      });
    } else {
      const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
      setExamQuestions(shuffled.slice(0, 35));
      setExamConfig(null);
      setSelectedExam({ 
        title: `${license.code} - Thi Sát Hạch`, 
        topic: `Thời gian: 22 phút - 35 câu hỏi` 
      });
    }
  };

  const getLicenseIcon = (code: string) => {
    if (code.startsWith('A')) return <Bike size={32} />;
    if (code.startsWith('B')) return <Car size={32} />;
    if (code.startsWith('C') || code.startsWith('F')) return <Truck size={32} />;
    return <Truck size={32} />; // D, E dùng chung icon xe lớn
  };

  // 1. Màn hình chi tiết bài thi (Placeholder)
  if (selectedExam) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 animate-fade-in relative min-h-[600px] p-4">
        <button 
          onClick={() => setSelectedExam(null)}
          className="absolute top-8 left-8 flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all hover:shadow-md border border-blue-100 z-20"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Quay lại danh sách đề</span>
        </button>
        
        {/* Quiz Interface Replaces Previous Start Screen */}
            <div className="w-full h-full flex items-center justify-center pt-16">
          <QuizGame 
            examTitle={selectedExam.title} 
            questions={examQuestions}
            onExit={() => setSelectedExam(null)} 
            examConfig={examConfig ?? undefined}
          />
        </div>
      </div>
    );
  }

  // 2. Màn hình chính (Trang chủ Thi Sát Hạch)
  return (
    <div className="w-full h-full bg-gradient-to-b from-white via-blue-50/30 to-white animate-fade-in overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Phần 1: Chọn Văn Bằng */}
        <div>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Chọn Văn Bằng</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Chọn hạng bằng lái xe bạn đang ôn tập để làm các đề thi sát với thực tế nhất.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {LICENSE_TYPES.map((license) => (
              <button 
                key={license.code}
                onClick={() => handleStartExamByLicense(license)}
                className={`
                  bg-white p-6 rounded-xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-left group
                  ${license.border} hover:border-current
                `}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${license.bg} ${license.color}`}>
                    {getLicenseIcon(license.code)}
                  </div>
                  <span className={`px-3 py-1.5 rounded text-sm font-bold ${license.bg} ${license.color}`}>
                    {license.code}
                  </span>
                </div>
                
                <h3 className={`text-xl font-bold group-hover:text-current text-gray-800`}>
                  {license.name}
                </h3>
                
                <div className="flex items-center text-sm font-medium text-gray-500 group-hover:text-current transition-colors mt-4">
                  <span>Vào thi ngay</span>
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180 transition-transform group-hover:translate-x-1" />
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
            onClick={() => {
              const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
              setExamQuestions(shuffled.slice(0, 35));
              setSelectedExam({ 
                title: "Thi Thử Ngẫu Nhiên", 
                topic: "Hệ thống sẽ tạo đề thi ngẫu nhiên dựa trên cấu trúc đề thi chuẩn của Bộ GTVT" 
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

        {/* Tips / Info Banner */}
        <div className="mt-16 bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 text-yellow-600">
            <AlertCircle size={24} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="font-bold text-yellow-800 text-lg mb-1">Lưu ý quan trọng</h4>
            <p className="text-yellow-700 text-sm">
              Cấu trúc đề thi và thời gian làm bài sẽ thay đổi tùy theo hạng bằng bạn chọn. 
              Hãy chắc chắn chọn đúng hạng bằng để có kết quả đánh giá chính xác nhất.
            </p>
          </div>
          <button className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors shadow-sm">
            Xem quy định thi
          </button>
        </div>

      </div>
    </div>
  );
};

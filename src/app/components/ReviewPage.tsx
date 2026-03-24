import React, { useState, useEffect } from 'react';
import { Shield, Wrench, AlertTriangle, Map as MapIcon, Zap, Gavel, ArrowLeft, AlertCircle, CheckCircle, XCircle, Truck } from 'lucide-react';
import { Question } from '@/app/types';
import { QuizGame } from '@/app/components/QuizGame';

// Dữ liệu cho các chương ôn tập
const REVIEW_CHAPTERS = [
  {
    id: 1,
    title: "Chương I",
    topic: "Quy định chung và quy tắc giao thông đường bộ",
    detail: "166 câu (từ câu 1 đến câu 166)",
    icon: <Gavel size={32} className="text-blue-500" />
  },
  {
    id: 2,
    title: "Chương II",
    topic: "Nghiệp vụ vận tải",
    detail: "26 câu (từ câu 167 đến câu 192)",
    icon: <Truck size={32} className="text-purple-500" />
  },
  {
    id: 3,
    title: "Chương III",
    topic: "Văn hóa giao thông, đạo đức người lái xe",
    detail: "21 câu (từ câu 193 đến câu 213)",
    icon: <Shield size={32} className="text-green-500" />
  },
  {
    id: 4,
    title: "Chương IV",
    topic: "Kỹ thuật lái xe",
    detail: "56 câu (từ câu 214 đến câu 269)",
    icon: <Zap size={32} className="text-yellow-500" />
  },
  {
    id: 5,
    title: "Chương V",
    topic: "Cấu tạo và sửa chữa",
    detail: "35 câu (từ câu 270 đến câu 304)",
    icon: <Wrench size={32} className="text-gray-500" />
  },
  {
    id: 6,
    title: "Chương VI",
    topic: "Hệ thống biển báo đường bộ",
    detail: "182 câu (từ câu 305 đến câu 486)",
    icon: <AlertTriangle size={32} className="text-orange-500" />
  },
  {
    id: 7,
    title: "Chương VII",
    topic: "Giải các thế sa hình và kỹ năng xử lý tình huống",
    detail: "114 câu (từ câu 487 đến câu 600)",
    icon: <MapIcon size={32} className="text-purple-500" />
  }
];

interface ReviewPageProps {
  questions: Question[];
}

export const ReviewPage: React.FC<ReviewPageProps> = ({ questions }) => {
  // Read API-provided chapter question counts once per render (from localStorage 'chapters')
  const apiCounts = React.useMemo(() => {
    try {
      if (typeof window === 'undefined') return new Map();
      const raw = window.localStorage.getItem('chapters');
      if (!raw) return new Map();
      const parsed = JSON.parse(raw) as any[];
      if (!Array.isArray(parsed)) return new Map();
      const m: Map<number, number> = new Map();
      for (const c of parsed) {
        const id = Number(c.id);
        const len = Array.isArray(c.questionIds) ? c.questionIds.length : 0;
        m.set(id, len);
      }
      return m;
    } catch (err) {
      return new Map();
    }
  }, []);
  const [selectedChapter, setSelectedChapter] = useState<typeof REVIEW_CHAPTERS[0] | null>(null);
  const [showParalysisOnly, setShowParalysisOnly] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [attemptResult, setAttemptResult] = useState<'correct' | 'wrong' | null>(null);
  const [wrongQuestionIds, setWrongQuestionIds] = useState<string[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('wrongQuestions') : null;
      if (!raw) return [];
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('wrongQuestions', JSON.stringify(wrongQuestionIds));
      }
    } catch (err) {
      // ignore
    }
  }, [wrongQuestionIds]);

  // Filter questions based on selection
  // Special rule: when user selects Chapter 1, prefer to use the API-provided chapter (API id 0)
  // stored in localStorage `chapters` if available, and show questions whose numeric API ids
  // are listed in that chapter's questionIds. Otherwise fall back to filtering by question.chapterId.
  const filteredQuestions = React.useMemo(() => {
    if (showParalysisOnly) {
      return questions.filter(q => q.isParalysis);
    }

    if (selectedChapter) {
      // If selected is chapter 1, try to consult stored API chapters for questionIds
      if (selectedChapter.id === 1) {
        try {
          if (typeof window !== 'undefined') {
            const raw = window.localStorage.getItem('chapters');
            if (raw) {
              const parsed = JSON.parse(raw) as any[];
              if (Array.isArray(parsed) && parsed.length > 0) {
                // In our app we stored chapters as 1-based ids, matching UI.
                const apiChap = parsed.find(c => Number(c.id) === 1 && Array.isArray(c.questionIds));
                if (apiChap && Array.isArray(apiChap.questionIds) && apiChap.questionIds.length > 0) {
                  const ids = new Set(apiChap.questionIds.map((n: any) => Number(n)));
                  return questions.filter(q => {
                    // Questions imported from API are stored with id like `api-<num>`; try to parse numeric id
                    if (typeof q.id === 'string' && q.id.startsWith('api-')) {
                      const n = Number(q.id.replace(/^api-/, ''));
                      return ids.has(n);
                    }
                    return false;
                  });
                }
              }
            }
          }
        } catch (err) {
          // ignore and fall back
        }
      }

      // Default fallback: filter by assigned chapterId on each question
      return questions.filter(q => q.chapterId === selectedChapter.id);
    }
    return [];
  }, [questions, selectedChapter, showParalysisOnly]);

  // If a chapter is selected or paralysis-only mode, launch the ReviewGame (exam-like UI)
  if (selectedChapter || showParalysisOnly) {
    const title = showParalysisOnly ? 'Các câu điểm liệt' : selectedChapter?.title || 'Ôn tập';
    return (
      <QuizGame
        examTitle={title}
        questions={filteredQuestions}
        onExit={() => { setSelectedChapter(null); setShowParalysisOnly(false); }}
        showTimer={false}
        submitButtonText="Hoàn thành"
        showImmediateExplanation={true}
      />
    );
  }

  // 2. Mặc định: Hiển thị danh sách các chương ôn tập
  return (
    <div className="w-full h-full bg-gradient-to-b from-white via-blue-50/30 to-white animate-fade-in overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Nội Dung Ôn Tập 600 Câu Hỏi
          </h2>
          <p className="text-gray-600">Học theo từng chương để nắm vững kiến thức luật giao thông đường bộ</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {REVIEW_CHAPTERS.map((chapter) => {
            const apiCount = apiCounts.get(chapter.id);
            const displayDetail = (typeof apiCount === 'number' && apiCount > 0) ? `${apiCount} câu` : chapter.detail;
            return (
            <button 
              key={chapter.id}
              onClick={() => setSelectedChapter(chapter)}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl border border-gray-100 hover:border-blue-200 transition-all duration-300 flex flex-col gap-4 hover:-translate-y-1 group text-left h-full"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                  {chapter.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {chapter.title}
                  </h3>
                </div>
              </div>
              
              <p className="text-gray-700 text-sm leading-relaxed flex-1">
                {chapter.topic}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                  {displayDetail}
                </span>
                <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600 rotate-180 transition-all" />
              </div>
            </button>
            );
          })}
          
          {/* Nút Các câu hay liệt */}
          <button 
            onClick={() => setShowParalysisOnly(true)}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl border border-gray-100 hover:border-red-200 transition-all duration-300 flex flex-col gap-4 hover:-translate-y-1 group text-left h-full"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-50 to-red-100 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                  Các câu điểm liệt
                </h3>
              </div>
            </div>
            
            <p className="text-gray-700 text-sm leading-relaxed flex-1">
              Tổng hợp các câu hỏi điểm liệt quan trọng
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
              <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                Ôn tập hiệu quả
              </span>
              <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-red-600 rotate-180 transition-all" />
            </div>
          </button>

          {/* Nút Câu Hỏi Biển Báo */}
          <button
            onClick={() => {
              const chap = REVIEW_CHAPTERS.find(c => c.id === 6);
              if (chap) setSelectedChapter(chap as any);
            }}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl border border-gray-100 hover:border-orange-200 transition-all duration-300 flex flex-col gap-4 hover:-translate-y-1 group text-left h-full"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                <AlertTriangle size={32} className="text-orange-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                  Câu hỏi Biển báo
                </h3>
              </div>
            </div>

            <p className="text-gray-700 text-sm leading-relaxed flex-1">
              Tổng hợp các câu hỏi về hệ thống biển báo đường bộ
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
              <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                Biển báo & ký hiệu
              </span>
              <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-orange-600 rotate-180 transition-all" />
            </div>
          </button>

          {/* Nút Câu Hỏi Tình Huống */}
          <button
            onClick={() => {
              const chap = REVIEW_CHAPTERS.find(c => c.id === 7);
              if (chap) setSelectedChapter(chap as any);
            }}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl border border-gray-100 hover:border-purple-200 transition-all duration-300 flex flex-col gap-4 hover:-translate-y-1 group text-left h-full"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                <MapIcon size={32} className="text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                  Câu hỏi Tình huống
                </h3>
              </div>
            </div>

            <p className="text-gray-700 text-sm leading-relaxed flex-1">
              Câu hỏi tình huống và các thế sa hình để luyện kỹ năng xử lý
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
              <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded">
                Tình huống & sa hình
              </span>
              <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-purple-600 rotate-180 transition-all" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
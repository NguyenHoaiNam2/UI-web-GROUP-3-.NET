import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, Search, AlertTriangle, Layers, Download, Eye, FileText, BookOpen, Settings, RefreshCw, LayoutDashboard, Users, FileEdit, BarChart, ChevronLeft, ChevronRight, CheckCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { CHAPTERS, Question, Chapter } from '@/app/types';
import { url } from '../../env.js';

interface AdminPageProps {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  chapters?: Chapter[];
}

export const AdminPage: React.FC<AdminPageProps> = ({ questions, setQuestions, chapters: propChapters }) => {
  const chapters = propChapters && propChapters.length ? propChapters : CHAPTERS;
  const [adminTab, setAdminTab] = useState<'questions'|'exams'|'settings'>('questions');
  const [isEditing, setIsEditing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChapter, setFilterChapter] = useState<number | 'ALL'>('ALL');
  const [filterParalysis, setFilterParalysis] = useState<boolean | 'ALL'>('ALL');

  // Image Gallery State
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [serverImages, setServerImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // Pagination for questions
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form Handlers
  const fetchServerImages = async () => {
    setIsLoadingImages(true);
    setIsImageGalleryOpen(true);
    try {
      const res = await fetch(url + 'assets/uploads/'); 
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setServerImages(data);
      } else {
        toast.error('Chưa lấy được list hình ảnh. Có thể máy chủ chưa cấu hình API tại assets/uploads/');
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải danh sách hình ảnh từ máy chủ');
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleAddNew = () => {
    setCurrentQuestion({
      id: '',
      content: '',
      options: ['', '', '', ''],
                        explanation: '',
                        imageUrl: '',
      correctAnswer: 0,
      chapterId: 1,
      isParalysis: false,
    });
    setIsEditing(true);
  };

  const handleEdit = (q: Question) => {
    setCurrentQuestion({ ...q });
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này không?')) {
      setQuestions(prev => prev.filter(q => q.id !== id));
      toast.success('Đã xóa câu hỏi thành công');
    }
  };

  const handleDeleteAll = () => {
    if (!questions || questions.length === 0) {
      toast.error('Không có câu hỏi để xóa');
      return;
    }
    if (!confirm('Bạn sắp xóa toàn bộ câu hỏi trong hệ thống. Thao tác này không thể hoàn tác. Tiếp tục?')) return;
    setQuestions([]);
    try {
      window.localStorage.removeItem('questions');
    } catch {}
    toast.success('Đã xóa toàn bộ câu hỏi');
  };

  const handleSave = async () => {
    const filledOptions = currentQuestion.options?.filter(o => o.trim() !== '') || [];
    if (!currentQuestion.content || filledOptions.length < 2) {
      toast.error('Vui lòng điền đầy đủ nội dung câu hỏi và ít nhất 2 đáp án');
      alert('Vui lòng điền đầy đủ nội dung câu hỏi và ít nhất 2 đáp án!');
      return;
    }

    // Filter out blank options before saving
    const trimmedOptions = currentQuestion.options?.map(o => o.trim()).filter(o => o !== '') || [];
    const validCorrectAnswer = currentQuestion.correctAnswer !== undefined && currentQuestion.correctAnswer < trimmedOptions.length 
      ? currentQuestion.correctAnswer 
      : 0;

    const finalQuestion = {
      ...currentQuestion,
      options: trimmedOptions,
      correctAnswer: validCorrectAnswer
    };

    if (finalQuestion.id) {
      // Update
      setQuestions(prev => prev.map(q => q.id === finalQuestion.id ? finalQuestion as Question : q));
      toast.success('Cập nhật câu hỏi thành công');
      alert('Cập nhật câu hỏi thành công');
      setIsEditing(false);
    } else {
      // Create via API
      try {
        const payload = {
          content: finalQuestion.content,
          options: finalQuestion.options,
          explanation: finalQuestion.explanation || '',
          imageUrl: finalQuestion.imageUrl || '',
          correctAnswer: finalQuestion.correctAnswer,
          chapterId: finalQuestion.chapterId,
          isParalysis: finalQuestion.isParalysis || false
        };

        console.log("Đang gửi lên API:", url + 'api/questions', payload);

        const response = await fetch(url + 'api/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const addedQuestion = await response.json();
          const newQuestion = {
            ...currentQuestion,
            explanation: currentQuestion.explanation || '',
            id: addedQuestion.id?.toString() || Math.random().toString(36).slice(2, 11),
          } as Question;
          setQuestions(prev => [...prev, newQuestion]);
          toast.success('Thêm câu hỏi mới thành công (API)');
          alert('Thêm câu hỏi mới thành công (API)');
          setIsEditing(false);
        } else {
          const errorText = await response.text();
          console.error("API Error Response:", response.status, errorText);
          toast.error('Lỗi khi thêm câu hỏi ở máy chủ: ' + response.status);
          alert('Lỗi từ máy chủ API: ' + response.status + '\n' + errorText);
        }
      } catch (error) {
        console.error('Lỗi kết nối:', error);
        toast.error('Không thể kết nối với API');
        alert('Không thể kết nối với API: ' + (error as Error).message);
      }
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

    // Note: per-option explanations removed from UI. Keep handler removed.

  // Filter Logic
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChapter = filterChapter === 'ALL' || q.chapterId === filterChapter;
    const matchesParalysis = filterParalysis === 'ALL' || q.isParalysis === filterParalysis;
    return matchesSearch && matchesChapter && matchesParalysis;
  });

  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Review chapters management (admin can create/update chapters used by ReviewPage)
  interface ReviewChapter { id: number; title: string; topic: string; detail?: string; questionIds?: number[] }

  const DEFAULT_REVIEW_CHAPTERS: ReviewChapter[] = [
    { id: 1, title: 'Chương I', topic: 'Quy định chung và quy tắc giao thông đường bộ', detail: '166 câu (từ câu 1 đến câu 166)', questionIds: [] },
    { id: 2, title: 'Chương II', topic: 'Nghiệp vụ vận tải', detail: '26 câu (từ câu 167 đến câu 192)', questionIds: [] },
    { id: 3, title: 'Chương III', topic: 'Văn hóa giao thông, đạo đức người lái xe', detail: '21 câu (từ câu 193 đến câu 213)', questionIds: [] },
    { id: 4, title: 'Chương IV', topic: 'Kỹ thuật lái xe', detail: '56 câu (từ câu 214 đến câu 269)', questionIds: [] },
    { id: 5, title: 'Chương V', topic: 'Cấu tạo và sửa chữa', detail: '35 câu (từ câu 270 đến câu 304)', questionIds: [] },
    { id: 6, title: 'Chương VI', topic: 'Hệ thống biển báo đường bộ', detail: '182 câu (từ câu 305 đến câu 486)', questionIds: [] },
    { id: 7, title: 'Chương VII', topic: 'Giải các thế sa hình và kỹ năng xử lý tình huống', detail: '114 câu (từ câu 487 đến câu 600)', questionIds: [] },
  ];

  const [reviewChapters, setReviewChapters] = useState<ReviewChapter[]>(() => {
    try {
      const raw = window.localStorage.getItem('reviewChapters');
      if (!raw) return DEFAULT_REVIEW_CHAPTERS;
      const parsed = JSON.parse(raw) as ReviewChapter[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_REVIEW_CHAPTERS;
    } catch {
      return DEFAULT_REVIEW_CHAPTERS;
    }
  });
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewChapter | null>(null);

  const saveReviewChapters = (arr: ReviewChapter[]) => {
    setReviewChapters(arr);
    try { window.localStorage.setItem('reviewChapters', JSON.stringify(arr)); } catch {}
  };

  const openEditReview = (r?: ReviewChapter) => {
    setEditingReview(r ? { ...r } : { id: Date.now() % 100000, title: '', topic: '', detail: '', questionIds: [] });
    setIsReviewModalOpen(true);
  };

  const applyReviewMappingToQuestions = () => {
    // Trích xuất các ID câu hỏi từ ngân hàng câu hỏi vào các chương ôn tập dựa theo chapterId của câu hỏi
    const updatedRc = reviewChapters.map(rc => {
      const matchedQs = questions.filter(q => q.chapterId === rc.id);
      const qIds = matchedQs.map(q => {
        if (typeof q.id === 'string' && q.id.startsWith('api-')) return Number(q.id.replace('api-', ''));
        return Number(q.id);
      }).filter(n => !isNaN(n));
      return { ...rc, questionIds: qIds };
    });
    saveReviewChapters(updatedRc);
    toast.success('Đã đồng bộ số lượng câu hỏi vào các chương Ôn Tập!');
  };

  // Admin: fetch questions from remote API and merge/replace local questions
  const fetchQuestionsFromServer = async () => {
    try {
      toast.info('Đang tải dữ liệu từ máy chủ...');
      let allData: any[] = [];
      
      // Fetch questions for each of the 7 chapters (1 to 7)
      for (let chapterNum = 1; chapterNum <= 7; chapterNum++) {
        try {
          const res1 = await fetch(url + 'api/CauHoi?Chuong=' + chapterNum + '&SoLuong=60&trang=1');       
          if (res1.ok) {
            const rawData1 = await res1.json();
            const totalPages = rawData1.totalPages || 1;
            
            // Get first page questions
            if (rawData1.questions && Array.isArray(rawData1.questions)) {
              allData = allData.concat(rawData1.questions.map((q: any) => ({ ...q, explicitChapterId: chapterNum })));
            } else {
              const data = Array.isArray(rawData1) ? rawData1 : (rawData1.data || rawData1.items || []);
              allData = allData.concat(data.map((q: any) => ({ ...q, explicitChapterId: chapterNum })));
            }
            
            // Fetch remaining pages for this chapter
            for (let i = 2; i <= totalPages; i++) {
              try {
                const r = await fetch(url + 'api/CauHoi?Chuong=' + chapterNum + '&SoLuong=60&trang=' + i);
                if (r.ok) {
                  const pageData = await r.json();
                  if (pageData.questions && Array.isArray(pageData.questions)) {
                     allData = allData.concat(pageData.questions.map((q: any) => ({ ...q, explicitChapterId: chapterNum })));
                  }
                }
              } catch (e) {
                console.warn(`Failed to fetch chapter ${chapterNum} page ${i}`, e);
              }
            }
          }
        } catch (e) {
          console.warn(`Failed to fetch chapter ${chapterNum}`, e);
        }
      }

      if (allData.length === 0) throw new Error('Không có dữ liệu câu hỏi');
      
      const mapped: Question[] = allData.map((q: any) => {
        const options = Array.isArray(q.answers) ? q.answers.map((a: any) => a?.answerContent ?? String(a)) : [];
        let correctIndex = 0;
        if (Array.isArray(q.answers)) {
          const idx = q.answers.findIndex((a: any) => a && a.isCorrect === true);
          if (idx !== -1) correctIndex = idx;
        }

        // Use the explicitChapterId set during fetch, fallback to categories, then 1 
        let chapterId = q.explicitChapterId || 1;
        if (!q.explicitChapterId && Array.isArray(q.categories) && q.categories.length > 0) {
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

      // Merge: keep existing local questions (by id) and add/update from API
      let merged: Question[] = [];
      setQuestions(prev => {
        const byId = new Map(prev.map(p => [p.id, p]));
        for (const mq of mapped) byId.set(mq.id, mq);
        merged = Array.from(byId.values());
        try { window.localStorage.setItem('questions', JSON.stringify(merged)); } catch {}
        return merged;
      });

      setReviewChapters(prevRc => {
        const updatedRc = prevRc.map(rc => {
          const matchedQs = merged.filter(q => q.chapterId === rc.id);
          const qIds = matchedQs.map(q => {
            if (typeof q.id === 'string' && q.id.startsWith('api-')) return Number(q.id.replace('api-', ''));
            return Number(q.id);
          }).filter(n => !isNaN(n));
          return { ...rc, questionIds: qIds };
        });
        try { window.localStorage.setItem('reviewChapters', JSON.stringify(updatedRc)); } catch {}
        return updatedRc;
      });
      toast.success(`Đã tải ${mapped.length} câu hỏi từ server`);
    } catch (err) {
      console.warn('Failed to fetch questions from API', err);
      toast.error('Không thể tải câu hỏi từ server. Kiểm tra API và thử lại.');
    }
  };

  useEffect(() => {
    fetchQuestionsFromServer();
  }, []);

  return (
    <>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-col hidden md:flex z-50">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900">Admin Panel</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'questions', label: 'Ngân hàng câu hỏi', icon: BookOpen },
            { id: 'exams', label: 'Quản lý đề thi', icon: FileEdit },
            { id: 'settings', label: 'Cài đặt', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setAdminTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                adminTab === item.id 
                  ? 'bg-blue-50 text-blue-700 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={18} className={adminTab === item.id ? 'text-blue-600' : 'text-gray-400'} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen p-4 sm:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Main sections based on tab */}
          <div className="space-y-6">

            {/* Question Bank Section */}
            {adminTab === 'questions' && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-6 sm:p-8 border-b border-gray-100 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Ngân Hàng Câu Hỏi</h2>
                      <p className="text-sm text-gray-500 mt-1">Quản lý {questions.length} câu hỏi trong hệ thống</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg">Tổng: <strong className="ml-2">{questions.length}</strong></span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg">Câu điểm liệt: <strong className="ml-2">{questions.filter(q => q.isParalysis).length}</strong></span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg">Chương khác: <strong className="ml-2">{new Set(questions.map(q => q.chapterId)).size}</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <button
                      onClick={handleAddNew}
                      className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all transform hover:scale-105 font-medium"
                    >
                      <Plus size={20} />
                      <span>Thêm Câu Hỏi Mới</span>
                    </button>
                    <button
                      onClick={fetchQuestionsFromServer}
                      className={`w-full md:w-auto bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all font-medium`}
                      title="Lấy câu hỏi từ server"
                    >
                      <RefreshCw size={18} />
                      <span className="hidden sm:inline">Lấy từ server</span>
                    </button>
                    <button
                      onClick={handleDeleteAll}
                      disabled={questions.length === 0}
                      className={`w-full md:w-auto bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all font-medium ${questions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Xóa tất cả câu hỏi"
                    >
                      <Trash2 size={18} />
                      <span className="hidden sm:inline">Xóa tất cả</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 sm:p-8 bg-gray-50/50">
                  {/* Filters */}
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Tìm kiếm nội dung câu hỏi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                      />
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            value={filterChapter}
                            onChange={(e) => setFilterChapter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white min-w-[180px] transition-all"
                        >
                            <option value="ALL">Tất cả chương</option>
                            {chapters.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>

                        <select
                            value={String(filterParalysis)}
                            onChange={(e) => setFilterParalysis(e.target.value === 'ALL' ? 'ALL' : e.target.value === 'true')}
                            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all"
                        >
                            <option value="ALL">Tất cả loại câu</option>
                            <option value="false">Câu thường</option>
                            <option value="true">Câu điểm liệt</option>
                        </select>
                    </div>
                  </div>

                  {/* Question Table & Pagination */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="p-4 font-semibold text-gray-600 text-sm">ID</th>
                          <th className="p-4 font-semibold text-gray-600 text-sm">Nội dung</th>
                          <th className="p-4 font-semibold text-gray-600 text-sm">Chương</th>
                          <th className="p-4 font-semibold text-gray-600 text-sm text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {paginatedQuestions.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-gray-500">
                                Không tìm thấy câu hỏi nào.
                              </td>
                            </tr>
                          ) : (
                            paginatedQuestions.map((q, i) => (
                              <motion.tr
                                key={q.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                              >
                                <td className="p-4 text-sm text-gray-500 align-top max-w-[80px] break-all">
                                  {q.id.toString().replace('api-', '')}
                                </td>
                                <td className="p-4 align-top">
                                  <div className="flex items-start gap-2 mb-1">
                                    {q.isParalysis && (
                                      <span className="inline-flex shrink-0 items-center justify-center p-1 bg-red-100 text-red-600 rounded-md" title="Câu điểm liệt">
                                        <AlertTriangle size={14} />
                                      </span>
                                    )}
                                    <span className="font-medium text-gray-900 line-clamp-2" title={q.content}>{q.content}</span>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                                    {q.options.length} đáp án - Đáp án đúng: số {q.correctAnswer + 1}
                                  </div>
                                </td>
                                <td className="p-4 align-top w-48">
                                  <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg">
                                    {chapters.find(c => c.id === q.chapterId)?.title || `Chương ${q.chapterId}`}
                                  </span>
                                </td>
                                <td className="p-4 align-top w-28 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button onClick={() => handleEdit(q)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                                      <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(q.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))
                          )}
                        </AnimatePresence>
                      </tbody>
                    </table>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <span className="text-sm text-gray-600">
                          Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredQuestions.length)} trong {filteredQuestions.length} câu
                        </span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 rounded-lg text-gray-600 disabled:opacity-50 hover:bg-white bg-gray-50"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <div className="flex items-center px-2 space-x-1">
                            <span className="text-sm font-medium">{currentPage} / {totalPages}</span>
                          </div>
                          <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-200 rounded-lg text-gray-600 disabled:opacity-50 hover:bg-white bg-gray-50"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.section>
            )}

            {/* Review Chapters Management */}
            {adminTab === 'exams' && (
              <motion.div className="p-6 sm:p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Quản lý nội dung Ôn Tập / Đề Thi</h3>
                    <p className="text-sm text-gray-500">Tạo/sửa các chương ôn tập và gán danh sách câu hỏi (questionIds)</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditReview()} className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2"><Plus size={16}/> Thêm chương</button>
                    <button onClick={applyReviewMappingToQuestions} className="px-4 py-2 bg-green-600 text-white rounded-xl flex items-center gap-2"><RefreshCw size={16}/> Áp dụng phân chương</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {reviewChapters.map(rc => (
                    <div key={rc.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xl font-bold text-gray-900">{rc.title}</div>
                          <div className="text-sm font-medium text-blue-600 mt-1">{rc.topic}</div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => openEditReview(rc)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit size={16}/></button>
                          <button onClick={() => { saveReviewChapters(reviewChapters.filter(x => x.id !== rc.id)); toast.success('Đã xóa chương ôn tập'); }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-auto pt-4 border-t border-gray-50">
                        <div className="mb-2">{rc.detail}</div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-gray-700 font-medium">
                          <BookOpen size={14} />
                          {Array.isArray(rc.questionIds) ? rc.questionIds.length : 0} câu hỏi
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </div> {/* End .space-y-6 */}
        </div> {/* End .max-w-6xl */}
      </main>
    </div>

    {/* Edit Modal */}
      <AnimatePresence>
      {isEditing && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-gray-900/80 backdrop-blur-sm"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        {currentQuestion.id ? <Edit size={20} /> : <Plus size={20} />}
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">
                          {currentQuestion.id ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}
                      </h2>
                    </div>
                    <button onClick={() => setIsEditing(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-8 overflow-y-auto flex-1">
                    {/* Chapter & Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Chương</label>
                            <select
                                value={currentQuestion.chapterId}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, chapterId: Number(e.target.value) })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition-all"
                            >
                                {chapters.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                             <label className="flex items-center gap-3 cursor-pointer select-none p-3 border border-gray-200 rounded-xl w-full hover:bg-gray-50 transition-colors h-[50px]">
                                <input
                                    type="checkbox"
                                    checked={currentQuestion.isParalysis}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, isParalysis: e.target.checked })}
                                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500 border-gray-300"
                                />
                                <span className={`font-medium ${currentQuestion.isParalysis ? 'text-red-600' : 'text-gray-600'}`}>
                                    Đánh dấu là câu điểm liệt
                                </span>
                       </label>
                        </div>
                    </div>

          {/* Question Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung câu hỏi</label>
            <textarea
              value={currentQuestion.content}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, content: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Nhập nội dung câu hỏi..."
            />
          </div>

          {/* Image Selection Button */}
          <div className="mt-4 mb-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Hình ảnh đính kèm (tuỳ chọn)</label>
            <div className="flex gap-3 items-center">
              <button
                type="button"
                onClick={fetchServerImages}
                className="px-6 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-medium transition-colors border border-blue-200"
              >
                {currentQuestion.imageUrl ? 'Đổi hình ảnh' : 'Chọn hình ảnh từ máy chủ...'}
              </button>
              
              {currentQuestion.imageUrl && (
                <button
                  type="button"
                  onClick={() => setCurrentQuestion({ ...currentQuestion, imageUrl: '' })}
                  className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors font-medium border border-red-100"
                >
                  Xóa / Bỏ chọn
                </button>
              )}
            </div>
            
            {currentQuestion.imageUrl && (
              <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200 inline-block w-full text-center">
                <p className="text-xs text-gray-500 mb-3 truncate flex items-center justify-center gap-1">
                  Đang chọn: <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">{currentQuestion.imageUrl}</span>
                </p>
                <img 
                  src={url + 'assets/uploads/' + currentQuestion.imageUrl} 
                  alt="preview" 
                  className="max-h-48 mx-auto rounded-lg border border-gray-200 shadow-md bg-white object-contain" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.insertAdjacentHTML('beforeend', '<p class="text-sm text-red-500 mt-2">Không tìm thấy ảnh trên máy chủ!</p>');
                  }}
                />
              </div>
            )}
          </div>

                    {/* (Giải thích moved below options) */}

                    {/* Options */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Các phương án trả lời</label>
                        <div className="space-y-3">
                            {currentQuestion.options?.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        checked={currentQuestion.correctAnswer === idx}
                                        onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: idx })}
                                        className="w-5 h-5 text-green-600 focus:ring-green-500 cursor-pointer"
                                        title="Chọn làm đáp án đúng"
                                    />
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                        className={`flex-1 px-4 py-3 border rounded-xl outline-none transition-all ${currentQuestion.correctAnswer === idx ? 'border-green-500 bg-green-50 ring-1 ring-green-200' : 'border-gray-200 focus:border-blue-500 bg-gray-50 focus:bg-white'}`}
                                        placeholder={`Đáp án ${idx + 1}`}
                                    />
                                    {currentQuestion.options && currentQuestion.options.length > 2 && (
                                        <button
                                            onClick={() => {
                                                const newOpts = currentQuestion.options?.filter((_, i) => i !== idx);
                                                let newCorrect = currentQuestion.correctAnswer || 0;
                                                if (idx < newCorrect) newCorrect--;
                                                if (idx === newCorrect) newCorrect = 0;
                                                setCurrentQuestion({ ...currentQuestion, options: newOpts, correctAnswer: newCorrect });
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Xóa lựa chọn này"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentQuestion({
                                ...currentQuestion,
                                options: [...(currentQuestion.options || []), '']
                            })}
                            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors w-fit"
                        >
                            <Plus size={16} />
                            Thêm phương án
                        </button>

                        {/* Explanation */}
                        <div className="mt-6 mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Giải thích (tuỳ chọn)</label>
                            <textarea
                                value={currentQuestion.explanation || ''}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50 focus:bg-white transition-all"
                                placeholder="Nhập phần giải thích cho câu hỏi (ví dụ: tại sao đáp án này đúng, các chú ý...)"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 shrink-0">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition-colors flex items-center gap-2"
                    >
                        <Save size={20} />
                        Lưu Thay Đổi
                    </button>
                </div>
            </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
      {/* Review Chapter Edit Modal */}
        <AnimatePresence>
          {isReviewModalOpen && editingReview && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.98, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 10 }} className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-semibold text-lg">{editingReview.id ? 'Chỉnh sửa chương ôn tập' : 'Thêm chương'}</h3>
                  <button onClick={() => setIsReviewModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">ID</label>
                    <input type="number" value={editingReview.id} onChange={(e) => setEditingReview({...editingReview, id: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Tiêu đề</label>
                    <input value={editingReview.title} onChange={(e) => setEditingReview({...editingReview, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Chủ đề</label>
                    <input value={editingReview.topic} onChange={(e) => setEditingReview({...editingReview, topic: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Chi tiết</label>
                    <input value={editingReview.detail} onChange={(e) => setEditingReview({...editingReview, detail: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Danh sách questionIds (phân tách bằng dấu phẩy)</label>
                    <textarea value={(editingReview.questionIds || []).join(',')} onChange={(e) => setEditingReview({...editingReview, questionIds: e.target.value.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n))})} className="w-full px-4 py-2 border rounded-lg" rows={3} />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setIsReviewModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-100">Hủy</button>
                    <button onClick={() => { const others = reviewChapters.filter(r => r.id !== editingReview.id); saveReviewChapters([...others, editingReview]); setIsReviewModalOpen(false); toast.success('Lưu chương ôn tập'); }} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Lưu</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Máy chủ / Image Selection Modal */}
      <AnimatePresence>
        {isImageGalleryOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.98, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 10 }} className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <div>
                  <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                    <ImageIcon className="text-blue-600" /> Thư viện hình ảnh trên máy chủ
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Chọn một hình ảnh có sẵn từ máy chủ làm ảnh tải lên.</p>
                </div>
                <button onClick={() => setIsImageGalleryOpen(false)} className="p-3 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-all">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                {isLoadingImages ? (
                  <div className="flex flex-col items-center justify-center py-20 h-full">
                     <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                     <p className="text-gray-500 font-medium">Đang tải danh sách hình ảnh từ máy chủ...</p>
                  </div>
                ) : serverImages.length === 0 ? (
                  <div className="text-center py-20 px-4 h-full flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <ImageIcon className="text-gray-400 w-10 h-10" />
                    </div>
                    <p className="text-gray-800 font-bold mb-2">Không tìm thấy hình ảnh nào</p>
                    <p className="text-gray-500 max-w-sm mx-auto">Chưa có hình ảnh nào trên máy chủ hoặc API lấy danh sách ảnh (api/images) chưa được cấu hình trả về dữ liệu.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {serverImages.map((imgName, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentQuestion({ ...currentQuestion, imageUrl: imgName });
                          setIsImageGalleryOpen(false);
                        }}
                        className={`group relative rounded-xl overflow-hidden border-2 transition-all bg-white shadow-sm hover:shadow-md ${currentQuestion.imageUrl === imgName ? 'border-blue-500 ring-4 ring-blue-500/20 scale-[1.02] z-10' : 'border-gray-200 hover:border-blue-300'}`}
                      >
                        <div className="aspect-[4/3] bg-gray-50/50 flex items-center justify-center p-3 relative">
                          <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors" />
                          <img 
                            src={url + 'assets/uploads/' + imgName} 
                            alt={imgName} 
                            className="max-w-full max-h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>';
                            }}
                          />
                        </div>
                        <div className="bg-white border-t border-gray-100 flex items-center p-2.5">
                          <p className="text-gray-700 text-xs font-semibold truncate flex-1 text-left" title={imgName}>
                            {imgName}
                          </p>
                          {currentQuestion.imageUrl === imgName && (
                            <CheckCircle size={16} className="text-blue-600 shrink-0 ml-2" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};


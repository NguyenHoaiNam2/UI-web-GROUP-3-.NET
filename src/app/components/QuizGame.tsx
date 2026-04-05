import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight, ArrowLeft, RotateCcw, Loader2 } from 'lucide-react';
import { Question } from '@/app/types';
import {url} from '../../env.js'
interface QuizGameProps {
  examTitle: string;
  questions: Question[];
  onExit: () => void;
  // Optional: when viewing a past submission
  initialSelectedAnswers?: Record<string, number>;
  startShowResult?: boolean;
  readonly?: boolean;
  // exam configuration overrides
  examConfig?: {
    timeSeconds?: number; // total time in seconds
    passCount?: number; // minimum correct to pass
    paralysisMandatory?: boolean; // if true, any mistake on isParalysis causes fail
  };
  showTimer?: boolean;
  submitButtonText?: string;
  showImmediateExplanation?: boolean;
  autoAdvance?: boolean; // whether to automatically move to next question after answering
  allowUnsure?: boolean; // whether to show "mark unsure" checkbox and markers
  resultFullPage?: boolean; // when true, render result view to fill the page body
}

export const QuizGame: React.FC<QuizGameProps> = ({ examTitle, questions, onExit, initialSelectedAnswers, startShowResult, readonly, examConfig, showTimer = true, submitButtonText = 'Nộp bài', showImmediateExplanation = false, autoAdvance = true, allowUnsure = true, resultFullPage = false }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>(() => initialSelectedAnswers || {});
  const [unsureQuestions, setUnsureQuestions] = useState<Record<string, boolean>>(() => ({}));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const autoAdvanceTimer = useRef<number | null>(null);
  const defaultTime = (examConfig?.timeSeconds) ?? (22 * 60);
  const [timeLeft, setTimeLeft] = useState(defaultTime);
  const [showResult, setShowResult] = useState(!!startShowResult);
  const [showResultStep, setShowResultStep] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [focusedOptionIndex, setFocusedOptionIndex] = useState<number | null>(null);
  
  // State for mobile drawer
  const [isQuestionListOpen, setIsQuestionListOpen] = useState(false);

  // If no questions are provided, show loading state
  if (!questions || questions.length === 0) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center bg-white rounded-2xl shadow-xl p-8">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-800">Chưa có câu hỏi</h3>
        <p className="text-gray-500 mt-2">Đề thi này hiện tại chưa có dữ liệu câu hỏi.</p>
        <button 
          onClick={onExit}
          className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const usedQuestions = questions;
  const currentQuestion = usedQuestions[currentQuestionIndex];
  const totalQuestions = usedQuestions.length;

  // Reset exam state when question set changes.
  useEffect(() => {
    if (!questions || questions.length === 0) return;
    if (showResult || readonly) return;
    if (!initialSelectedAnswers) setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setTimeLeft((examConfig?.timeSeconds) ?? (22 * 60));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  useEffect(() => {
    if (showResult || readonly || !showTimer) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResult, readonly, showTimer]);

  // Clear any pending auto-advance timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = null;
      }
    };
  }, []);

  // Reset focus when question changes
  useEffect(() => {
    setFocusedOptionIndex(null);
  }, [currentQuestionIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (showResult || readonly) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (autoAdvanceTimer.current) {
            clearTimeout(autoAdvanceTimer.current);
            autoAdvanceTimer.current = null;
          }
          if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (autoAdvanceTimer.current) {
            clearTimeout(autoAdvanceTimer.current);
            autoAdvanceTimer.current = null;
          }
          if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedOptionIndex(prev => {
            if (prev === null) return currentQuestion.options.length - 1;
            return prev > 0 ? prev - 1 : currentQuestion.options.length - 1;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedOptionIndex(prev => {
            if (prev === null) return 0;
            return prev < currentQuestion.options.length - 1 ? prev + 1 : 0;
          });
          break;
        case 'Enter':
        case ' ': // Space
          if (focusedOptionIndex !== null && e.target === document.body) {
            e.preventDefault();
            handleSelectAnswer(focusedOptionIndex);
          } else if (focusedOptionIndex !== null && document.activeElement instanceof HTMLElement) {
             // If a button is focused natively, we might trigger twice if we're not careful.
             // Usually it's fine, but let's just make sure Space on a button clicks it anyway natively.
             if (e.key === ' ' && document.activeElement.tagName === 'BUTTON') return;
             e.preventDefault();
             handleSelectAnswer(focusedOptionIndex);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResult, readonly, currentQuestionIndex, totalQuestions, currentQuestion, focusedOptionIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (optionIndex: number) => {
    if (showResult || readonly) return;
    // clear any pending auto-advance timer
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }

    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }));

    // auto-advance to next question after short delay (unless last question)
    if (autoAdvance && currentQuestionIndex < totalQuestions - 1) {
      autoAdvanceTimer.current = window.setTimeout(() => {
        setCurrentQuestionIndex(prev => Math.min(prev + 1, totalQuestions - 1));
        autoAdvanceTimer.current = null;
      }, 500);
    }
  };

  const handleToggleUnsure = () => {
    if (showResult || readonly) return;
    setUnsureQuestions(prev => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id]
    }));
  };

  const handleNext = () => {
    // clear pending auto-advance when navigating manually
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    setShowResult(true);
    setIsSubmitted(true);

  try {
    const correct = usedQuestions.filter(q => selectedAnswers[q.id] === q.correctAnswer).length;
    const total = usedQuestions.length;
    const timeTakenSeconds = (examConfig?.timeSeconds ?? (22 * 60)) - timeLeft;

    const incorrectQuestions = usedQuestions.filter(q => selectedAnswers[q.id] !== q.correctAnswer);
    const failedByCritical = usedQuestions.some(q => q.isParalysis && selectedAnswers[q.id] !== q.correctAnswer);
    const passCount = typeof examConfig?.passCount === 'number' ? examConfig!.passCount : Math.floor(total * 0.9);
    const paralysisMandatory = examConfig?.paralysisMandatory ?? true;
    const passed = correct >= passCount && !(paralysisMandatory && failedByCritical);

      const attempt = {
        id: Date.now(),
        examTitle,
        date: new Date().toISOString(),
        correctCount: correct,
        totalQuestions: total,
        isPassed: passed,
        failedByCritical,
        timeTakenSeconds,
        incorrectQuestions,
        unsureQuestions,
        questions: usedQuestions,
        selectedAnswers,
      } as any;

      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('history') : null;
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(attempt);
      if (typeof window !== 'undefined') window.localStorage.setItem('history', JSON.stringify(arr));
    } catch (err) {
      console.error('Failed to save attempt to history', err);
    }
  };

  // Calculate score
  const correctCount = usedQuestions.filter(q => selectedAnswers[q.id] === q.correctAnswer).length;
  const failedByCritical = usedQuestions.some(q => q.isParalysis && selectedAnswers[q.id] !== q.correctAnswer);
  const passCountGlobal = typeof examConfig?.passCount === 'number' ? examConfig!.passCount : Math.floor(totalQuestions * 0.9);
  const paralysisMandatoryGlobal = examConfig?.paralysisMandatory ?? true;
  const isPassed = correctCount >= passCountGlobal && !(paralysisMandatoryGlobal && failedByCritical);

  if (showResult) {
    const outerClass = resultFullPage
      ? 'w-full h-full mx-0 bg-gray-50 rounded-none shadow-none overflow-hidden animate-fade-in flex flex-col'
      : 'w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-fade-in';

    const bodyClass = resultFullPage ? 'p-8 flex-1 overflow-y-auto max-w-5xl mx-auto w-full' : 'p-8 max-h-[70vh] overflow-y-auto';

    return (
      <div className={outerClass}>
        <div className={`p-10 text-center text-white relative overflow-hidden ${isPassed ? 'bg-green-600' : 'bg-red-500'}`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col items-center">
            {isPassed ? <CheckCircle size={80} className="mx-auto mb-4 drop-shadow-md" /> : <XCircle size={80} className="mx-auto mb-4 drop-shadow-md" />}
            <h2 className="text-4xl font-extrabold mb-2 tracking-tight drop-shadow-sm">{isPassed ? "ĐẠT KẾT QUẢ" : "KHÔNG ĐẠT"}</h2>
            <p className="text-xl font-medium text-white/90">Bạn đã trả lời đúng {correctCount}/{totalQuestions} câu hỏi</p>
            {!isPassed && failedByCritical && (
              <p className="mt-3 inline-block bg-red-900/40 px-4 py-1.5 rounded-lg text-sm font-semibold border border-red-400/50">Bạn không đạt do trả lời sai câu điểm liệt (câu bắt buộc).</p>
            )}
          </div>
        </div>
        
        <div className={bodyClass}>
          <h3 className="text-2xl font-bold mb-6 text-gray-800">Chi tiết bài làm</h3>
          <div className="space-y-6">
            {usedQuestions.map((q, index) => {
              const userAnswer = selectedAnswers[q.id];
              const isCorrect = userAnswer === q.correctAnswer;
              const isUnsure = !!unsureQuestions[q.id];

              const containerClass = `p-4 rounded-xl border-2 ${isUnsure ? 'border-yellow-400 bg-yellow-100' : (isCorrect ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50')}`;

              return (
                <div key={q.id} className={containerClass}>
                  <div className="flex gap-3">
                    <span className="font-bold text-gray-500">Câu {index + 1}:</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <p className="font-medium text-gray-900">{q.content}</p>
                        {isUnsure && (
                          <span className="text-xs font-semibold text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded">Không chắc</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt, i) => (
                          (() => {
                            const isOptCorrect = i === q.correctAnswer;
                            const isOptUser = i === userAnswer;
                            const baseClass = 'p-2 rounded-lg text-sm flex items-center justify-between';
                            const correctClass = 'bg-green-200 text-green-900 font-medium';
                            const wrongClass = 'bg-red-200 text-red-900';
                            const neutralClass = 'bg-transparent text-gray-700';
                            const unsureHighlightCorrect = isUnsure && isOptCorrect ? 'ring-2 ring-green-300' : '';
                            const unsureHighlightWrong = isUnsure && isOptUser && !isOptCorrect ? 'ring-2 ring-red-300' : '';
                            const combined = [baseClass, isOptCorrect ? correctClass : '', (isOptUser && !isOptCorrect) ? wrongClass : '', (!isOptUser && !isOptCorrect) ? neutralClass : '', unsureHighlightCorrect, unsureHighlightWrong].filter(Boolean).join(' ');

                            return (
                              <div key={i} className={combined}>
                                <span>{String.fromCharCode(65 + i)}. {opt}</span>
                                {isOptCorrect && <CheckCircle size={16} className="text-green-700" />}
                                {isOptUser && !isOptCorrect && <XCircle size={16} className="text-red-700" />}
                              </div>
                            );
                          })()
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[20px] text-amber-900 leading-relaxed">
                          <span className="font-bold text-amber-950">Giải thích:</span> {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-center">
          <button 
            onClick={onExit}
            className="flex items-center gap-2 px-8 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-all"
          >
            <RotateCcw size={20} /> Quay lại danh sách đề
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col md:flex-row bg-white text-gray-800 relative">
      {/* 
        ========================================
        MOBILE HEADER (Timer & Submit) - Displayed only on small screens
        ========================================
      */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          {showTimer && (
            <div className={`flex items-center gap-2 font-mono text-xl font-bold px-3 py-1.5 rounded-lg border ${timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
              <Clock size={18} className={timeLeft < 60 ? 'text-red-500' : 'text-blue-600'} />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 active:bg-green-700 text-white rounded-lg font-bold shadow-md shadow-green-600/20"
        >
          <CheckCircle size={18} /> {submitButtonText}
        </button>
      </div>

      {/* 
        ========================================
        SIDEBAR NAVIGATION (PC: Sidebar, Mobile: Drawer)
        ========================================
      */}
      {/* Mobile Backdrop for Drawer */}
      {isQuestionListOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsQuestionListOpen(false)}
        />
      )}

      {/* The Sidebar / Drawer container */}
      <div className={`
        fixed md:static inset-y-0 right-0 z-50 flex flex-col bg-white border-l md:border-l-0 md:border-r border-gray-200 shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out w-[85vw] max-w-[320px] md:w-80 md:flex-shrink-0 md:h-[calc(100vh-5rem)]
        ${isQuestionListOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        
        {/* Drawer Header (Mobile Only) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-bold text-gray-800 text-lg">Danh sách câu hỏi</h3>
          <button onClick={() => setIsQuestionListOpen(false)} className="p-2 text-gray-500 bg-gray-200 hover:bg-gray-300 rounded-full">
            <XCircle size={20} />
          </button>
        </div>

        {/* Timer & Info (PC ONLY - since mobile has it in header) */}
        <div className="hidden md:block p-6 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-center mb-4 text-gray-500">
            <span className="text-sm font-semibold uppercase tracking-wider">Thời gian còn lại</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">
              {Object.keys(selectedAnswers).length}/{totalQuestions} câu
            </span>
          </div>
          
          {showTimer && (
            <div className={`flex items-center justify-center gap-3 font-mono text-4xl p-4 rounded-xl font-bold shadow-inner ${timeLeft < 60 ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              <Clock size={28} className={timeLeft < 60 ? 'text-red-500' : 'text-blue-600'} />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Question List Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <h4 className="hidden md:flex font-bold text-gray-500 text-xs uppercase tracking-wider mb-4 items-center justify-between">
            <span>Danh sách câu hỏi</span>
            <span className="text-gray-400">{Object.keys(selectedAnswers).length}/{totalQuestions}</span>
          </h4>
          
          {/* Mobile progress indicator inside drawer */}
          <div className="md:hidden mb-4 px-2">
            <div className="flex justify-between text-sm font-semibold text-gray-600 mb-1">
              <span>Đã làm:</span>
              <span className="text-blue-600">{Object.keys(selectedAnswers).length}/{totalQuestions}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(Object.keys(selectedAnswers).length / totalQuestions) * 100}%` }}></div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2.5">
            {usedQuestions.map((q, idx) => {
              const selectedOptionIndex = selectedAnswers[q.id];
              const isAnswered = selectedOptionIndex !== undefined;
              const isCurrent = currentQuestionIndex === idx;
              const isMarked = unsureQuestions[q.id];
              
              let btnClass = "bg-white text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300 shadow-sm";
              if (isCurrent || isMarked) {
                btnClass = "bg-yellow-50 text-yellow-700 border-yellow-300 shadow-[0_0_10px_rgba(253,224,71,0.4)]";
              } else if (isAnswered) {
                btnClass = "bg-green-50 text-green-700 border-green-300";
              }
              
              const selectedOptionLabel = isAnswered ? String.fromCharCode(65 + selectedOptionIndex) : null;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  type="button"
                  className={`
                    relative w-full aspect-square flex items-center justify-center rounded-lg font-bold text-sm border 
                    transition-all duration-200 select-none box-border
                    ${btnClass}
                    ${isCurrent ? 'ring-2 ring-blue-500 ring-offset-2 scale-105 z-10' : ''}
                  `}
                >
                  <span className="pointer-events-none">{idx + 1}</span>
                  {selectedOptionLabel && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] rounded-full text-[10px] flex items-center justify-center font-extrabold shadow-sm bg-blue-600 text-white border-2 border-white">
                      {selectedOptionLabel}
                    </span>
                  )}
                  {isMarked && !selectedOptionLabel && (
                     <span className="absolute -top-1.5 -left-1.5 min-w-[20px] h-[20px] rounded-full text-[10px] flex items-center justify-center font-extrabold shadow-sm bg-yellow-500 text-white border-2 border-white">
                       ?
                     </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Submit Actions (PC ONLY) */}
        <div className="hidden md:block p-6 border-t border-gray-200 bg-white backdrop-blur-sm mt-auto z-10 bottom-0 sticky">
          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-600/30 transition-all hover:-translate-y-0.5"
          >
            <CheckCircle size={20} /> {submitButtonText}
          </button>
        </div>
      </div>

      {/* Main Content Area (Right) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white relative pb-[env(safe-area-inset-bottom)] md:pb-0">
        {/* Main Content Scroll Area - Leave room for Sticky Footer */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 lg:p-12 pb-32 md:pb-32 hide-scrollbar md:scrollbar-default">
          
          <div className="max-w-5xl mx-auto h-full flex flex-col mb-20 md:mb-0">
            {/* Header info for question */}
            <div className="mb-4 md:mb-6 flex items-center justify-between">
              <span className="inline-flex py-1 px-3 md:py-1.5 md:px-4 bg-blue-50 text-blue-700 rounded-lg text-sm md:text-base font-bold border border-blue-200 shadow-sm">
                Câu {currentQuestionIndex + 1} / {totalQuestions}
              </span>
              
              {allowUnsure && (
                <label className="inline-flex items-center gap-2 text-xs md:text-sm text-gray-500 hover:text-yellow-600 cursor-pointer transition-colors bg-white py-1.5 px-3 rounded-lg border border-gray-200 shadow-sm">
                  <input
                    type="checkbox"
                    checked={!!unsureQuestions[currentQuestion.id]}
                    onChange={handleToggleUnsure}
                    className="w-4 h-4 rounded border-gray-300 bg-white text-yellow-500 focus:ring-yellow-400 focus:ring-offset-white"
                  />
                  <span className="select-none font-medium hidden xs:inline">Đánh dấu xem lại</span>
                  <span className="select-none font-medium xs:hidden">Đánh dấu</span>
                </label>
              )}
            </div>

            {/* Split View for Question: Text & Image */}
            <div className={`flex flex-col ${currentQuestion.imageUrl ? 'lg:flex-row gap-6 md:gap-8 lg:gap-12' : ''} mb-8`}>
              
              {/* Question Text & Options */}
              <div className={`flex-1 flex flex-col space-y-4 md:space-y-6 ${currentQuestion.imageUrl ? 'lg:w-1/2' : ''}`}>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 leading-snug md:leading-relaxed">
                  {currentQuestion.content}
                </h3>

                <div className="space-y-3 mt-2 md:mt-4">
                  {currentQuestion.options.map((option, index) => {
                    const userAns = selectedAnswers[currentQuestion.id];
                    const isAnswered = userAns !== undefined;
                    const isOptCorrect = index === currentQuestion.correctAnswer;
                    const isOptUser = index === userAns;

                    let optionClass = 'w-full text-left p-4 md:p-5 rounded-xl border transition-all duration-200 flex items-start gap-4 group ';
                    
                    if (focusedOptionIndex === index) {
                      optionClass += 'ring-2 ring-blue-500 ring-offset-2 scale-[1.02] '; // Visual indicator for keyboard focus
                    }

                    if (isAnswered && showImmediateExplanation) {
                      if (isOptCorrect) {
                        optionClass += 'bg-green-50 border-green-500 text-green-800 shadow-md';
                      } else if (isOptUser && !isOptCorrect) {
                        optionClass += 'bg-red-50 border-red-500 text-red-800';
                      } else {
                        optionClass += 'bg-gray-50 border-gray-200 text-gray-500 opacity-70';
                      }
                    } else {
                      optionClass += isOptUser 
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-md scale-[1.01]' 
                        : 'bg-white hover:bg-blue-50/50 hover:border-blue-300 border-gray-200 text-gray-700';
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleSelectAnswer(index)}
                        className={optionClass}
                      >
                        <div className="flex items-center justify-center flex-shrink-0 mt-0.5">
                          {isAnswered && showImmediateExplanation ? (
                            isOptCorrect ? (
                              <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm">
                                <CheckCircle size={14} />
                              </div>
                            ) : isOptUser ? (
                              <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white shadow-sm">
                                <XCircle size={14} />
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-400">
                                <span className="text-xs font-bold">{String.fromCharCode(65 + index)}</span>
                              </div>
                            )
                          ) : (
                            isOptUser ? (
                              <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm">
                                <CheckCircle size={14} strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-full border-2 border-gray-300 group-hover:border-blue-400 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                                <span className="text-xs font-bold">{String.fromCharCode(65 + index)}</span>
                              </div>
                            )
                          )}
                        </div>
                        <span className="text-lg leading-snug">{option}</span>
                      </button>
                    );
                  })}
                </div>
                
                {/* Explanations (if shown immediately) */}
                {showImmediateExplanation && selectedAnswers[currentQuestion.id] !== undefined && (
                  <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/80 p-5 shadow-inner">
                    {currentQuestion.explanation && (
                      <div className="mb-4 text-[17px] leading-relaxed text-gray-700">
                        <span className="font-bold text-yellow-600 mr-2 text-lg">💡 Giải thích:</span> 
                        {currentQuestion.explanation}
                      </div>
                    )}
                    <div className="inline-flex bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
                      <span className="font-semibold text-gray-500 mr-2">Đáp án đúng:</span>
                      <strong className="text-green-600 ml-2">{currentQuestion.options[currentQuestion.correctAnswer]}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Area (Takes right half if exists) */}
              {currentQuestion.imageUrl && (
                <div className="w-full lg:w-1/2 flex items-start justify-center pt-2">
                  <div className="w-full h-40 md:h-auto bg-gray-50/50 p-2 md:p-4 rounded-2xl border border-gray-200 flex items-center justify-center shadow-inner overflow-hidden">
                    <img 
                      src={url +'assets/uploads/'+ currentQuestion.imageUrl} 
                      alt="Hình minh họa" 
                      className="max-w-full max-h-full object-contain rounded-xl drop-shadow-md" 
                    />
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* 
          ========================================
          STICKY FOOTER NAVIGATION (Mobile & Desktop)
          ========================================
        */}
        <div className="fixed md:absolute bottom-0 left-0 right-0 md:left-auto md:bottom-6 md:right-6 z-30 bg-white md:bg-white/95 border-t border-gray-200 md:border md:rounded-2xl shadow-[0_-4px_15px_rgba(0,0,0,0.05)] md:shadow-2xl p-3 md:p-2 backdrop-blur-md pb-[max(env(safe-area-inset-bottom),0.75rem)] md:pb-2">
          <div className="flex items-center justify-between md:justify-center gap-2 max-w-full md:w-[240px] mx-auto">
            {/* Button: Câu trước */}
            <button
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
              className={`flex-1 md:flex-none flex items-center justify-center py-2.5 px-3 md:w-[100px] md:py-3 rounded-xl font-bold transition-all ${
                currentQuestionIndex === 0 
                  ? 'opacity-30 cursor-not-allowed text-gray-400 bg-gray-50' 
                  : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900 active:scale-95 bg-white border border-gray-200 shadow-sm md:border-transparent md:shadow-none'
              }`}
              title="Câu trước"
            >
              <ArrowLeft size={18} className="mr-1" /> <span className="hidden xs:inline md:inline">Trước</span>
            </button>

            {/* Middle Divider (Desktop) / Menu button (Mobile) */}
            <div className="hidden md:block w-px h-8 bg-gray-200 mx-1"></div>
            
            {/* Nút mở danh sách (Mobile only) */}
            <button
              onClick={() => setIsQuestionListOpen(true)}
              className="md:hidden flex-none p-3 h-[44px] w-[50px] flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shadow-sm active:scale-95"
              title="Danh sách câu hỏi"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>

            {/* Button: Câu tiếp theo */}
            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === totalQuestions - 1}
              className={`flex-1 md:flex-none flex items-center justify-center py-2.5 px-3 md:w-[100px] md:py-3 rounded-xl font-bold transition-all ${
                currentQuestionIndex === totalQuestions - 1 
                  ? 'opacity-30 cursor-not-allowed text-gray-400 bg-gray-50' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-500/30 md:bg-white md:text-blue-600 md:border md:border-blue-100 md:shadow-lg md:hover:bg-blue-50 md:hover:text-blue-700'
              }`}
              title="Câu tiếp theo"
            >
              <span className="hidden xs:inline md:inline">Tiếp</span> <ArrowRight size={18} className="ml-1" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

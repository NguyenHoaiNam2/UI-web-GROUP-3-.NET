import React from 'react';
import { BookOpen, CheckCircle, ShieldCheck, Target, Trophy, Users } from 'lucide-react';

interface IntroPageProps {
  onNavigateToThi: () => void;
  onNavigateToDocs: () => void;
}

export const IntroPage: React.FC<IntroPageProps> = ({ onNavigateToThi, onNavigateToDocs }) => {
  return (
    <div className="w-full h-full bg-gradient-to-b from-white via-blue-50/30 to-white animate-fade-in overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-4">
            Giới thiệu nền tảng
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">GROUP 3 .NET TECH</h1>
          <p className="max-w-3xl mx-auto text-gray-700 text-lg leading-relaxed">
            Nền tảng ôn thi lý thuyết GPLX trực tuyến với trải nghiệm mô phỏng sát đề thi thật,
            giúp bạn học đúng trọng tâm, làm quen giao diện và tự tin trước kỳ thi chính thức.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <FeatureCard
            icon={<ShieldCheck className="text-blue-600" size={24} />}
            title="Chuẩn cấu trúc đề thi"
            desc="Bám sát định dạng đề thi của Bộ GTVT, hỗ trợ luyện theo hạng bằng và đề ngẫu nhiên."
          />
          <FeatureCard
            icon={<Target className="text-blue-600" size={24} />}
            title="Ôn tập đúng trọng tâm"
            desc="Phân chương rõ ràng, dễ tập trung vào phần kiến thức bạn còn yếu để cải thiện nhanh hơn."
          />
          <FeatureCard
            icon={<Trophy className="text-blue-600" size={24} />}
            title="Theo dõi kết quả"
            desc="Xem kết quả, lịch sử làm bài và phân tích đáp án để rút kinh nghiệm sau mỗi lần luyện tập."
          />
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 p-6 md:p-8 shadow-sm mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Nền tảng này dành cho ai?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
            <div className="flex items-start gap-3">
              <Users className="text-blue-600 mt-0.5" size={20} />
              <p>Học viên mới bắt đầu ôn thi GPLX cần lộ trình rõ ràng, dễ làm quen.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="text-blue-600 mt-0.5" size={20} />
              <p>Người cần luyện đề nhanh trước kỳ thi để tăng độ chính xác khi chọn đáp án.</p>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen className="text-blue-600 mt-0.5" size={20} />
              <p>Người muốn ôn theo chương hoặc xem tài liệu tổng hợp ngay trong một hệ thống.</p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-blue-600 mt-0.5" size={20} />
              <p>Người muốn luyện tập ổn định với giao diện trực quan, rõ ràng và dễ thao tác.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onNavigateToThi}
            className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Bắt đầu thi thử
          </button>
          <button
            onClick={onNavigateToDocs}
            className="px-8 py-3 rounded-xl bg-white border border-blue-200 text-blue-700 font-bold hover:bg-blue-50 transition-colors"
          >
            Xem tài liệu
          </button>
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc }) => (
  <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-700 leading-relaxed">{desc}</p>
  </div>
);

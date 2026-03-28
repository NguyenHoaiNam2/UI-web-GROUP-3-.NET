import React from 'react';
import { 
  ArrowRight, 
  BookOpen, 
  ShieldCheck, 
  Users, 
  Trophy, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Car,
  Signpost,
  Truck,
  Zap,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import * as Accordion from '@radix-ui/react-accordion';

interface HomePageProps {
  onNavigateToThi: () => void;
  onNavigateToDocs: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateToThi, onNavigateToDocs }) => {
  return (
  <div className="flex-1 flex flex-col w-full bg-gradient-to-b from-transparent via-blue-50/50 to-transparent animate-fade-in">
      {/* Hero Section */}
      <section className="relative w-full h-[600px] overflow-hidden flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1600965179346-bf53a7ff83f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcml2aW5nJTIwc2Nob29sJTIwY2FyJTIwbGVhcm5pbmclMjByb2FkfGVufDF8fHx8MTc2OTk0ODQ0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
            alt="Driving School" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/70"></div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-white space-y-6 max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
                GROUP 3 .NET TECH <br/>
                <span className="text-blue-300 text-3xl md:text-5xl">Nền Tảng Ôn Thi GPLX</span>
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed mb-8">
                Hệ thống mô phỏng chính xác phần mềm sát hạch quốc gia. Giúp bạn làm quen giao diện thi, củng cố kiến thức luật và đạt kết quả cao trong kỳ thi chính thức.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={onNavigateToThi}
                  className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  <Trophy size={24} />
                  Thi Thử Ngay
                </button>
                <button 
                  onClick={onNavigateToDocs}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-xl font-bold text-lg transition-all border border-white/30 flex items-center justify-center gap-2"
                >
                  <BookOpen size={24} />
                  Xem Tài Liệu
                </button>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block w-[400px]"
          >
            {/* Floating Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-white shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
               <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                   <ShieldCheck size={24} className="text-white" />
                 </div>
                 <div>
                   <h3 className="font-bold text-xl">Chuẩn Bộ GTVT</h3>
                   <p className="text-blue-100 text-sm">Cập nhật 2024</p>
                 </div>
               </div>
               <div className="space-y-3">
                 <div className="flex items-center justify-between text-sm">
                    <span>Chính xác</span>
                    <span className="font-bold">100%</span>
                 </div>
                 <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full w-full bg-green-400"></div>
                 </div>
                 <p className="text-sm text-blue-100 italic">"Dữ liệu được chuẩn hóa theo Tổng cục Đường bộ Việt Nam."</p>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* General Info Section (white background as requested) */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <span className="text-blue-600 font-bold uppercase tracking-wider text-sm">Về Hệ Thống</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Thông Tin Chung</h2>
              <div className="w-20 h-1 bg-blue-500 rounded-full"></div>

              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  <strong className="text-gray-900">Giới thiệu:</strong> Website cung cấp giải pháp thi thử và ôn tập lý thuyết lái xe ô tô trực tuyến, mô phỏng chính xác phần mềm sát hạch quốc gia.
                </p>
                <p>
                  <strong className="text-gray-900">Mục đích:</strong> Giúp học viên làm quen giao diện thi, củng cố kiến thức luật và đạt kết quả cao trong kỳ thi chính thức.
                </p>
                <p>
                  <strong className="text-gray-900">Đối tượng:</strong> Người học lái xe các hạng B1, B2, C, D, E, F.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="font-medium text-gray-800">Giao diện chuẩn</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="font-medium text-gray-800">Dữ liệu mới nhất</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="font-medium text-gray-800">Kết quả tức thì</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="font-medium text-gray-800">Hoàn toàn miễn phí</span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <img 
                src="https://images.unsplash.com/photo-1758612214917-81d7956c09de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBsZWFybmluZyUyMHN0dWRlbnQlMjBsYXB0b3B8ZW58MXx8fHwxNzcwMTE2MTA4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                alt="Online Learning" 
                className="rounded-2xl shadow-2xl w-full object-cover h-[400px]"
              />
            </div>
          </div>
        </div>
      </section>

  {/* Exam Structure Section */}
  <section className="py-20 bg-blue-600/70 text-white">
        <div className="container mx-auto px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-blue-200 font-bold uppercase tracking-wider text-sm">Quy chuẩn 600 câu</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">Thông Tin Kỳ Thi</h2>
            <p className="text-white/90 mt-4">Cấu trúc đề thi và điều kiện đậu cho từng hạng bằng.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ExamCard 
              title="Hạng B1" 
              questions="30 câu" 
              time="20 phút" 
              passScore="27/30" 
              icon={<Car size={32} />} 
              color="bg-blue-500"
            />
            <ExamCard 
              title="Hạng B2" 
              questions="35 câu" 
              time="22 phút" 
              passScore="32/35" 
              icon={<Car size={32} />} 
              color="bg-indigo-500"
            />
            <ExamCard 
              title="Hạng C" 
              questions="40 câu" 
              time="24 phút" 
              passScore="36/40" 
              icon={<Truck size={32} />} 
              color="bg-purple-500"
            />
            <ExamCard 
              title="Hạng D, E, F" 
              questions="45 câu" 
              time="26 phút" 
              passScore="41/45" 
              icon={<Truck size={32} />} 
              color="bg-orange-500"
            />
          </div>

          {/* Critical Question Warning */}
          <div className="mt-12 bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl flex items-start gap-4 shadow-sm max-w-4xl mx-auto">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-red-700 text-lg mb-1">Quy tắc "Câu Điểm Liệt"</h3>
              <p className="text-red-600/90 text-sm leading-relaxed">
                Mỗi đề thi có <strong>01 câu điểm liệt</strong> (tình huống mất an toàn nghiêm trọng). 
                Nếu làm sai câu này, bài thi bị <strong className="uppercase">HỦY BỎ (Rớt)</strong> ngay lập tức, 
                dù tổng điểm cao hơn mức quy định.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Question Bank Section */}
      <section className="py-20 bg-white/70">
        <div className="container mx-auto px-8">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-1/3 space-y-6">
              <span className="text-blue-600 font-bold uppercase tracking-wider text-sm">Nội dung ôn tập</span>
              <h2 className="text-3xl font-bold text-gray-800">Ngân Hàng 600 Câu Hỏi</h2>
              <p className="text-gray-600 leading-relaxed">
                Tổng hợp 600 câu hỏi lý thuyết lái xe ô tô dùng cho sát hạch, cấp giấy phép lái xe đường bộ.
                <br/><br/>
                Nguồn dữ liệu: Chuẩn hóa theo dữ liệu công khai của Tổng cục Đường bộ Việt Nam.
              </p>
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                 <h4 className="font-bold text-blue-900 mb-2">Phân loại kiến thức</h4>
                 <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Khái niệm và quy tắc giao thông</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Nghiệp vụ vận tải</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Văn hóa, đạo đức người lái xe</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Kỹ thuật lái xe & Cấu tạo sửa chữa</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Hệ thống biển báo đường bộ</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Giải các thế sa hình</li>
                 </ul>
              </div>
            </div>
            
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-lg group">
                  <img 
                    src="https://images.unsplash.com/photo-1549916028-5fe07973a5c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFmZmljJTIwc2lnbnMlMjByb2FkJTIwc2FmZXR5fGVufDF8fHx8MTc3MDE2MzU1M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                    alt="Traffic Signs"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                    <h3 className="text-white font-bold text-2xl mb-2">Hệ thống biển báo</h3>
                    <p className="text-gray-300">Nắm vững ý nghĩa của từng loại biển báo cấm, nguy hiểm, hiệu lệnh...</p>
                  </div>
               </div>
               <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-lg group">
                  <img 
                    src="https://images.unsplash.com/photo-1742997734865-71d10c491be5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBkcml2aW5nJTIwZGFzaGJvYXJkJTIwc2ltdWxhdG9yfGVufDF8fHx8MTc3MDE2MzU1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                    alt="Driving Simulation"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                    <h3 className="text-white font-bold text-2xl mb-2">600 Câu hỏi lý thuyết</h3>
                    <p className="text-gray-300">Hệ thống câu hỏi trắc nghiệm đầy đủ, cập nhật mới nhất theo quy định của Bộ GTVT.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

  {/* User Guide Section */}
  <section className="py-20 bg-blue-600/70 text-white">
        <div className="container mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Hướng Dẫn Sử Dụng</h2>
            <p className="text-white/90 mt-2">Quy trình 3 bước đơn giản để bắt đầu ôn luyện.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
             <StepCard 
               step="1"
               title="Chọn đề thi"
               description="Chọn hạng bằng muốn thi và chọn 'Làm theo bộ đề' hoặc 'Đề ngẫu nhiên'."
             />
             <StepCard 
               step="2"
               title="Làm bài thi"
               description="Chọn đáp án đúng duy nhất cho từng câu. Có thể đánh dấu câu khó để xem lại sau."
             />
             <StepCard 
               step="3"
               title="Nộp bài & Xem kết quả"
               description="Nhấn 'Kết thúc' để hệ thống chấm điểm và hiển thị kết quả chi tiết."
             />
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
             <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
               <Zap className="text-yellow-500" />
               Tính năng ôn tập thông minh
             </h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="flex items-start gap-3">
                 <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mt-1">
                   <Clock size={18} />
                 </div>
                 <div>
                   <h4 className="font-bold text-gray-700">Xem lại lịch sử</h4>
                   <p className="text-sm text-gray-500">Theo dõi tiến bộ qua biểu đồ điểm số và lịch sử làm bài.</p>
                 </div>
               </div>
               <div className="flex items-start gap-3">
                 <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mt-1">
                   <ShieldCheck size={18} />
                 </div>
                 <div>
                   <h4 className="font-bold text-gray-700">Chế độ ôn tập sâu</h4>
                   <p className="text-sm text-gray-500">Chỉ làm những câu hay sai hoặc ôn riêng 60 câu điểm liệt.</p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Stats & Results Preview */}
      <section className="py-20 bg-white/70">
        <div className="container mx-auto px-8 text-center">
           <h2 className="text-3xl font-bold text-gray-800 mb-12">Kết Quả & Phân Tích Chi Tiết</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatFeature title="Kết quả tức thì" desc="ĐẠT hoặc KHÔNG ĐẠT ngay sau khi nộp bài." icon={<Zap size={24} />} />
              <StatFeature title="Điểm số chi tiết" desc="Ví dụ: 34/35. Hiển thị chính xác số câu đúng." icon={<Trophy size={24} />} />
              <StatFeature title="Phân tích lỗi" desc="Xem lại câu sai kèm giải thích đáp án đúng." icon={<AlertTriangle size={24} />} />
              <StatFeature title="Gợi ý ôn tập" desc="Hệ thống đề xuất phần kiến thức cần cải thiện." icon={<BookOpen size={24} />} />
           </div>
        </div>
      </section>

  {/* FAQ & Support */}
  <section className="py-20 bg-blue-600/70 text-white">
        <div className="container mx-auto px-8 max-w-4xl">
           <h2 className="text-3xl font-bold text-center text-white mb-12">Câu Hỏi Thường Gặp</h2>
           
           <Accordion.Root type="single" defaultValue="item-1" collapsible className="space-y-4">
              <AccordionItem white value="item-1" question="Đề thi có giống thi thật không?">
                Cấu trúc và nội dung giống 100% đề thi của Bộ GTVT. Chúng tôi cập nhật dữ liệu thường xuyên để đảm bảo tính chính xác.
              </AccordionItem>
              <AccordionItem white value="item-2" question="Quên mật khẩu lấy lại thế nào?">
                Bạn có thể sử dụng chức năng "Quên mật khẩu" ở màn hình đăng nhập. Hệ thống sẽ gửi email hướng dẫn đặt lại mật khẩu cho bạn.
              </AccordionItem>
              <AccordionItem white value="item-3" question="Tôi có cần trả phí để sử dụng không?">
                Hiện tại, nền tảng GROUP 3 .NET TECH cung cấp các tính năng thi thử và ôn tập hoàn toàn miễn phí cho cộng đồng.
              </AccordionItem>
              <AccordionItem white value="item-4" question="Làm sao để xem lại các câu đã làm sai?">
                Sau khi nộp bài, bạn có thể xem chi tiết bài làm. Ngoài ra, trong phần "Ôn Tập", bạn có thể chọn chế độ "Câu hay sai" để luyện tập lại.
              </AccordionItem>
           </Accordion.Root>
        </div>
      </section>
    </div>
  );
};

const ExamCard = ({ title, questions, time, passScore, icon, color }: { title: string, questions: string, time: string, passScore: string, icon: React.ReactNode, color: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-white mb-4 shadow-lg shadow-${color}/30`}>
      {icon}
    </div>
    <h3 className="font-bold text-xl text-gray-800 mb-2">{title}</h3>
    <ul className="space-y-2 text-sm text-gray-600">
      <li className="flex justify-between">
        <span>Số câu:</span>
        <span className="font-medium text-gray-900">{questions}</span>
      </li>
      <li className="flex justify-between">
        <span>Thời gian:</span>
        <span className="font-medium text-gray-900">{time}</span>
      </li>
      <li className="flex justify-between border-t border-gray-100 pt-2 mt-2">
        <span className="text-green-600 font-medium">Đạt:</span>
        <span className="font-bold text-green-700">{passScore}</span>
      </li>
    </ul>
  </div>
);

const StepCard = ({ step, title, description }: { step: string, title: string, description: string }) => (
  <div className="relative p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
    <div className="absolute -top-4 -left-4 w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold shadow-md text-lg">
      {step}
    </div>
    <h3 className="font-bold text-xl text-gray-800 mb-3 mt-2">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </div>
);

const StatFeature = ({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) => (
  <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 flex flex-col items-center">
     <div className="text-blue-600 mb-4 bg-blue-100 p-3 rounded-full">{icon}</div>
     <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
     <p className="text-sm text-gray-600">{desc}</p>
  </div>
);

const AccordionItem = ({ value, question, children, white }: { value: string, question: string, children: React.ReactNode, white?: boolean }) => (
  <Accordion.Item value={value} className={`${white ? 'bg-white rounded-xl border border-gray-200 overflow-hidden' : 'bg-blue-700/30 rounded-xl border border-blue-500/20 overflow-hidden'}`}>
    <Accordion.Header className="flex">
      <Accordion.Trigger className={`${white ? 'flex-1 flex items-center justify-between p-4 font-bold text-gray-800 hover:bg-gray-50 transition-colors [&[data-state=open]>svg]:rotate-180 text-left' : 'flex-1 flex items-center justify-between p-4 font-bold text-white hover:bg-blue-700/40 transition-colors [&[data-state=open]>svg]:rotate-180 text-left'}`}>
        {question}
        <ChevronDown className={`${white ? 'text-gray-400 transition-transform duration-300' : 'text-white/80 transition-transform duration-300'}`} size={20} />
      </Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content className={`${white ? 'p-4 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-100 bg-white/50 data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden' : 'p-4 pt-0 text-white/90 text-sm leading-relaxed border-t border-blue-500/10 bg-blue-700/20 data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden'}`}>
       <div className="pt-4">{children}</div>
    </Accordion.Content>
  </Accordion.Item>
);

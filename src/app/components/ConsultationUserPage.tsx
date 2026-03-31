

interface ConsultationUserPageProps {
  setShowCall: (v: boolean) => void;
}

export const ConsultationUserPage: React.FC<ConsultationUserPageProps> = ({ setShowCall }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="text-xl font-semibold text-blue-600">
        Đây là trang Thảo luận dành cho User
      </div>

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => setShowCall(true)}
      >
        📞 Start Call
      </button>
    </div>
  );
};
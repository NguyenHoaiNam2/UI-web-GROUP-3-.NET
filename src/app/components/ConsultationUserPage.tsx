import React, { useState } from "react";
import CallPopup from "./CallPopup";

export const ConsultationUserPage: React.FC = () => {
  const [showCall, setShowCall] = useState(false);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      
      <div className="text-xl font-semibold text-blue-600">
        Đây là trang Thảo luận dành cho User
      </div>

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => setShowCall(true)}
      >
        📞 Start Call
      </button>

      {showCall && (
        <CallPopup onClose={() => setShowCall(false)} />
      )}
    </div>
  );
};
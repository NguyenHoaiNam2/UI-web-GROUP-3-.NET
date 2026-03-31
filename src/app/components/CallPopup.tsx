import React from "react";
import VideoCallLayout from "./VideoCallLayout";

interface CallPopupProps {
  onClose: () => void;
  isMinimized: boolean;                  // nhận từ parent
  setIsMinimized: (v: boolean) => void;  // nhận từ parent
}

const CallPopup: React.FC<CallPopupProps> = ({
  onClose,
  isMinimized,
  setIsMinimized,
}) => {
  return (
    <div
  className={`fixed z-[9999] bg-white shadow-lg transition-all duration-300 ${
    isMinimized
      ? "bottom-4 right-4 w-48 h-12 rounded-lg cursor-pointer"
      : "inset-0 w-full h-full"
  }`}
  onClick={() => isMinimized && setIsMinimized(false)}
>

  {/* VideoCallLayout luôn tồn tại */}
  <div
    className={`absolute inset-0 transition-all duration-300 ${
      isMinimized
        ? "opacity-0 pointer-events-none"
        : "opacity-100"
    }`}
  >
    <VideoCallLayout
      onEndCall={onClose}
      onMinimize={() => setIsMinimized(true)}
    />
  </div>

  {/* Mini UI */}
  {isMinimized && (
    <div className="flex items-center justify-center h-full font-semibold">
      Cuộc gọi (click để mở)
    </div>
  )}
</div>
  );
};

export default CallPopup;
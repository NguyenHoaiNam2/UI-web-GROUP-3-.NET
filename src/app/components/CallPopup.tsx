import React from "react";
import VideoCallLayout from "./VideoCallLayout";

interface CallPopupProps {
  onClose: () => void;
}

const CallPopup: React.FC<CallPopupProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white">
      <VideoCallLayout onEndCall={onClose} />
    </div>
  );
};

export default CallPopup;
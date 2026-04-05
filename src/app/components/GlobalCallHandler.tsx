// GlobalCallHandler.tsx
import React, { useEffect, useState, useRef } from "react";
import ringSound from "../../assets/ring.mp3";
import { useSignalR } from "../contexts/SignalRContext";
import VideoCallLayout from "./VideoCallLayout";   // ← import trực tiếp

export const GlobalCallHandler: React.FC = () => {
  const { incomingCall, acceptCall, rejectCall, isInCall, endCall, meCalling, cancelCall } = useSignalR();

  const [isMinimized, setIsMinimized] = useState(false);
  const hasHandledRef = useRef(false);
  // ==================== Audio Ring ====================
  const [audio] = useState(() => {
    const a = new Audio(ringSound);
    a.loop = true;
    a.volume = 0.3;
    return a;
  });

  // Cleanup audio
  useEffect(() => {
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);

  // Ring khi có incoming call
  useEffect(() => {
    if (incomingCall) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [incomingCall, audio]);

  // Đồng bộ minimized khi isInCall thay đổi
  useEffect(() => {
    if (!isInCall) {
      setIsMinimized(false);
    }
  }, [isInCall]);


  // ==================== Xử lý Accept ====================
  const handleAccept = async () => {
    if (!incomingCall) return;
    audio.pause();
    audio.currentTime = 0;
    await acceptCall();
  };

  // ==================== Xử lý Reject ====================
  const handleReject = async () => {
    if (!incomingCall) return;
    audio.pause();
    audio.currentTime = 0;
    await rejectCall();
  };
  // ==================== Huỷ cuộc gọi ====================
  const handleCancelCall = async () => {
    console.log("🛑 Bên gọi huỷ cuộc gọi");
    hasHandledRef.current = true;
    await cancelCall();
  };

  // ==================== Kết thúc cuộc gọi ====================
  const handleEndCall = async () => {
    console.log("🛑 [GlobalCallHandler] User clicked End Call - Calling server...");
    setIsMinimized(false);
    await endCall();        // hàm từ Context
  };

  // ==================== 1. Modal Incoming Call ====================
  if (incomingCall && !isInCall) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
        <div className="bg-white p-8 rounded-3xl text-center shadow-2xl w-96">
          <div className="text-6xl mb-4">📞</div>
          <h2 className="text-2xl font-bold mb-2">Cuộc gọi đến</h2>
          <p className="text-sm mb-6">
            <strong>{incomingCall.fromName}</strong> đang gọi cho bạn...
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleAccept}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-2xl font-semibold text-sm transition"
            >
              Nhận cuộc gọi
            </button>
            <button
              onClick={handleReject}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-2xl font-semibold text-sm transition"
            >
              Từ chối
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 2. Modal Đang Gọi (cho người gọi - MỚI) ====================
  if (!incomingCall && !isInCall && meCalling) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
        <div className="bg-white p-8 rounded-3xl text-center shadow-2xl w-96">
          <div className="text-6xl mb-4">📞</div>
          <h2 className="text-2xl font-bold mb-2">Đang gọi...</h2>
          <p className="text-sm mb-6 text-gray-600">
            Đang chờ người kia chấp nhận cuộc gọi
          </p>

          <button
            onClick={handleCancelCall}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-2xl font-semibold text-sm transition w-full"
          >
            Huỷ cuộc gọi
          </button>
        </div>
      </div>
    );
  }

  // ==================== 3. Call Popup (Full / Minimized) ====================
  if (isInCall) {
    return (
      <div
        className={`fixed z-[9999] bg-white shadow-lg transition-all duration-300 ${isMinimized
          ? "bottom-4 right-4 w-48 h-12 rounded-lg cursor-pointer"
          : "inset-0 w-full h-full"
          }`}
        onClick={() => isMinimized && setIsMinimized(false)}
      >
        {/* VideoCallLayout */}
        <div
          className={`absolute inset-0 transition-all duration-300 ${isMinimized ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
        >
          <VideoCallLayout
            onEndCall={handleEndCall}
            onMinimize={() => setIsMinimized(true)}
          />
        </div>

        {/* Mini UI khi minimize */}
        {isMinimized && (
          <div className="flex items-center justify-center h-full font-semibold text-sm">
            Đang gọi điện thoại...
          </div>
        )}
      </div>
    );
  }

  return null;
};
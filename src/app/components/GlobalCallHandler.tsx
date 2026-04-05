// GlobalCallHandler.tsx
import React, { useEffect, useState } from "react";
import ringSound from "../../assets/ring.mp3";
import { useSignalR } from "../contexts/SignalRContext";   // ← import này

export const GlobalCallHandler: React.FC = () => {
  const { incomingCall, acceptCall, rejectCall } = useSignalR();

  const [audio] = useState(() => {
    const a = new Audio(ringSound);
    a.loop = true;
    a.volume = 0.3;
    return a;
  });

  useEffect(() => {
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);

  // Bắt đầu / dừng ring khi có incomingCall
  useEffect(() => {
    if (incomingCall) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [incomingCall, audio]);

  const handleAccept = async () => {
    await acceptCall();
  };

  const handleReject = async () => {
    await rejectCall();
  };

  if (!incomingCall) return null;

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
};
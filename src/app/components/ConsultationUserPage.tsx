import React, { useEffect, useState } from "react";
import { useSignalR } from "../contexts/SignalRContext";

interface ConsultationUserPageProps {
  setShowCall: (v: boolean) => void;
}

interface User {
  userId: string;
  name: string;
  role: string;
  isCalling: boolean;
}

export const ConsultationUserPage: React.FC<ConsultationUserPageProps> = ({
  setShowCall,
}) => {
    const { users, isOnline, meCalling, callUser, toggleOnline } = useSignalR();

  
    // Banner
    const banners = [
      "https://picsum.photos/800/400?1",
      "https://picsum.photos/800/400?2",
      "https://picsum.photos/800/400?3",
    ];
  
    const [currentIndex, setCurrentIndex] = useState(0);
  
    // Auto slide banner
    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 3000);
  
      return () => clearInterval(interval);
    }, [banners.length]);   // tốt hơn là để banners.length
  
    const handleCall = (user: User) => callUser(user.userId);

  return (
    <div className="flex flex-col h-[calc(100vh-90px)] p-4 gap-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-red-600">
          Tư vấn trực tuyến
        </h1>

        <div className="flex items-center gap-3">
          {/* Status Dot */}
          <div className="relative w-4 h-4">
            {isOnline && (
              <span className="absolute w-4 h-4 rounded-full bg-green-400 opacity-40 animate-ping" />
            )}
            <div
              className={`w-4 h-4 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
            />
          </div>

          {/* Toggle Button */}
          <button
            onClick={toggleOnline}
            className={`w-24 h-10 rounded-xl text-white font-semibold transition-colors ${isOnline ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 hover:bg-gray-500"
              }`}
          >
            {isOnline ? "Online" : "Offline"}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 gap-4">
        {/* LEFT - Danh sách quản lý */}
        <div className="w-1/3 bg-white rounded-2xl shadow p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Danh sách quản lý</h2>

          <div className="flex-1 overflow-auto">
            {!isOnline ? (
              <div className="text-center text-gray-500 mt-10">
                Bạn đang offline
              </div>
            ) : users.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                Không có quản lý online
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.userId}
                  className="flex justify-between items-center p-3 border-b last:border-b-0"
                >
                  <div>
                    <div className="font-medium">{user.name}</div>
                    {user.isCalling && (
                      <div className="text-xs text-red-500">Đang bận</div>
                    )}
                  </div>

                  <button
                    disabled={user.isCalling || meCalling}
                    onClick={() => handleCall(user)}
                    className={`px-4 py-1.5 rounded-lg text-white font-medium transition ${user.isCalling || meCalling
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                      }`}
                  >
                    {user.isCalling || meCalling ? "Bận" : "Gọi"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT - Banner */}
        <div className="flex-1 bg-white rounded-2xl shadow p-4 flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full rounded-xl overflow-hidden">
            {banners.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`banner-${index}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${index === currentIndex ? "opacity-100" : "opacity-0"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
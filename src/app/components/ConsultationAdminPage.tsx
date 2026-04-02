import React, { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
}

export const ConsultationAdminPage: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);

  // Fake data user online
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: "Nguyễn Văn A" },
    { id: 2, name: "Trần Thị B" },
  ]);

  // Banner images
  const banners = [
    "https://picsum.photos/800/400?1",
    "https://picsum.photos/800/400?2",
    "https://picsum.photos/800/400?3",
    "https://picsum.photos/800/400?3",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto slide mỗi 3 giây
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);


  const handleCall = (user: User) => {
    alert(`Gọi đến ${user.name}`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-90px)] p-4 gap-4">
      {/* Toggle Online */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-red-600">
          Quản lý tư vấn trực tuyến
        </h1>

        {/* STATUS ANIMATION */}
        <div className="flex items-center gap-3">
          {/* STATUS DOT */}
          <div className="relative flex items-center justify-center w-5 h-5">
            {isOnline && (
              <span className="absolute w-5 h-5 rounded-full bg-green-400 opacity-30 animate-ping"></span>
            )}

            <div
              className={`w-5 h-5 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
            />
          </div>
          <div className="relative flex items-center justify-center w-5 h-5">
            {isOnline && (
              <span className="absolute w-5 h-5 rounded-full bg-green-400 opacity-30 animate-ping"></span>
            )}

            <div
              className={`w-5 h-5 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
            />
          </div>
          <div className="relative flex items-center justify-center w-5 h-5">
            {isOnline && (
              <span className="absolute w-5 h-5 rounded-full bg-green-400 opacity-30 animate-ping"></span>
            )}

            <div
              className={`w-5 h-5 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
            />
          </div>

          {/* BUTTON */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`w-25 h-10 flex items-center justify-center rounded-xl text-white font-semibold transition shrink-0 ${isOnline ? "bg-green-500" : "bg-gray-400"
              }`}
          >
            {isOnline ? "Online" : "Offline"}
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 gap-4">
        {/* LEFT: User list */}
        <div className="w-1/3 bg-white rounded-2xl shadow p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">
            Danh sách người dùng  đang trực tuyến
          </h2>

          <div className="flex-1 overflow-auto">
            {users.length === 0 ? (
              <div className="text-gray-500 text-center mt-10">
                Không có người dùng trực tuyến
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex justify-between items-center p-3 border-b"
                >
                  <span>{user.name}</span>
                  <button
                    onClick={() => handleCall(user)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
                  >
                    Gọi
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Banner slider */}
        <div className="flex-1 bg-white rounded-2xl shadow p-4 flex flex-col items-center justify-center">
          <div className="relative w-full h-full overflow-hidden rounded-xl">
            {banners.map((img, index) => (
              <img
                key={index}
                src={img}
                alt="banner"
                className={`absolute w-full h-full object-cover transition-opacity duration-700 ${index === currentIndex ? "opacity-100" : "opacity-0"
                  }`}
              />
            ))}
          </div>

          {/* Dots */}
          <div className="flex mt-4 gap-2">
            {banners.map((_, index) => (
              <div
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full cursor-pointer ${index === currentIndex
                  ? "bg-blue-500"
                  : "bg-gray-300"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { url } from "../../env.js";
import ringSound from "../../assets/ring.mp3";

interface ConsultationUserPageProps {
  setShowCall: (v: boolean) => void;
}

interface User {
  userId: string;
  name: string;
  role: string;
  isCalling: boolean;
}

export const ConsultationUserPage: React.FC<ConsultationUserPageProps> = ({ setShowCall }) => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [meCalling, setMeCalling] = useState(false);

  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [isRinging, setIsRinging] = useState(false);

  // 🔊 audio (1 lần duy nhất)
  const [audio] = useState(() => {
    const a = new Audio(ringSound);
    a.loop = true;
    a.volume = 0.3;
    return a;
  });

  // Banner
  const banners = [
    "https://picsum.photos/800/400?1",
    "https://picsum.photos/800/400?2",
    "https://picsum.photos/800/400?3",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 🔌 tạo connection
  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(url + "consultationHub", {
        accessTokenFactory: () => localStorage.getItem("accessToken") || ""
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, []);

  // 🚀 start + events
  useEffect(() => {
    if (!connection) return;

    const start = async () => {
      try {
        await connection.start();
        console.log("✅ SignalR connected");

        connection.on("ReceiveOnlineUsers", (data: User[]) => {
          setUsers(data);
        });

        connection.on("IncomingCall", (data) => {
          console.log("📞 IncomingCall");
          setIncomingCall(data);
          setIsRinging(true);

          audio.play().catch(err => console.log("Audio error:", err));
        });

        connection.on("CallAccepted", () => {
          console.log("✅ CallAccepted");
          setShowCall(true);
        });

        connection.on("CallRejected", () => {
          console.log("❌ CallRejected");

          audio.pause();
          audio.currentTime = 0;

          setIsRinging(false);
          setMeCalling(false);
        });

        connection.on("CallTimeout", () => {
          console.log("⏳ CallTimeout");

          alert("⏳ Không có phản hồi");

          audio.pause();
          audio.currentTime = 0;

          setIncomingCall(null);
          setIsRinging(false);
          setMeCalling(false);
        });

        if (isOnline) {
          await connection.invoke("Register");
        }

      } catch (err) {
        console.error("❌ SignalR error:", err);
      }
    };

    start();

    return () => {
      // 🔥 QUAN TRỌNG: remove tất cả listener
      connection.off("ReceiveOnlineUsers");
      connection.off("IncomingCall");
      connection.off("CallAccepted");
      connection.off("CallRejected");
      connection.off("CallTimeout");

      connection.stop();
    };

  }, [connection]);

  // 🔄 toggle online
  useEffect(() => {
    if (!connection) return;

    if (connection.state !== "Connected") return;

    if (isOnline) {
      connection.invoke("Register");
    } else {
      connection.invoke("SetOffline");
      setUsers([]);
    }
  }, [isOnline]);

  // 📞 gọi admin
  const handleCall = async (user: User) => {
    if (!connection || incomingCall) return; // ✅ chặn

    setMeCalling(true);
    await connection.invoke("CallUser", user.userId);
  };

  // ✅ nhận
  const handleAccept = async () => {
    if (!connection || !incomingCall) return;

    audio.pause();
    audio.currentTime = 0;
    setIsRinging(false);

    await connection.invoke("AcceptCall", incomingCall.fromUserId);

    setIncomingCall(null);
    setMeCalling(false);  // ✅ đã accept
    setShowCall(true);
  };

  // ❌ từ chối
  const handleReject = async () => {
    if (!connection || !incomingCall) return;

    audio.pause();
    audio.currentTime = 0;
    setIsRinging(false);

    await connection.invoke("RejectCall", incomingCall.fromUserId);

    setIncomingCall(null);
    setMeCalling(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-90px)] p-4 gap-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-red-600">
          Tư vấn trực tuyến
        </h1>

        <div className="flex items-center gap-3">
          {/* DOT */}
          <div className="relative w-4 h-4">
            {isOnline && (
              <span className="absolute w-4 h-4 rounded-full bg-green-400 opacity-40 animate-ping"></span>
            )}
            <div className={`w-4 h-4 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
          </div>

          {/* BUTTON */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`w-24 h-10 rounded-xl text-white font-semibold ${isOnline ? "bg-green-500" : "bg-gray-400"}`}
          >
            {isOnline ? "Online" : "Offline"}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-1 gap-4">

        {/* LEFT */}
        <div className="w-1/3 bg-white rounded-2xl shadow p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">
            Danh sách quản lý
          </h2>

          <div className="flex-1 overflow-auto">
            {!isOnline ? (
              <div className="text-gray-500 text-center mt-10">
                Bạn đang offline
              </div>
            ) : users.length === 0 ? (
              <div className="text-gray-500 text-center mt-10">
                Không có quản lý online
              </div>
            ) : (
              users.map((user) => (
                <div key={user.userId} className="flex justify-between items-center p-3 border-b">
                  <div>
                    <div>{user.name}</div>
                    {user.isCalling && (
                      <div className="text-xs text-red-500">Đang bận</div>
                    )}
                  </div>

                  <button
                    disabled={user.isCalling || meCalling}
                    onClick={() => handleCall(user)}
                    className={`px-3 py-1 rounded-lg text-white ${user.isCalling || meCalling
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

        {/* RIGHT */}
        <div className="flex-1 bg-white rounded-2xl shadow p-4 flex items-center justify-center">
          <div className="relative w-full h-full overflow-hidden rounded-xl">
            {banners.map((img, index) => (
              <img
                key={index}
                src={img}
                className={`absolute w-full h-full object-cover transition-opacity duration-700 ${index === currentIndex ? "opacity-100" : "opacity-0"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 📞 POPUP */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl text-center w-80">
            <h2 className="text-xl font-bold mb-2">📞 Cuộc gọi đến</h2>
            <p>{incomingCall.fromName} đang gọi...</p>

            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={handleAccept}
                className="bg-green-500 text-white px-4 py-2 rounded-lg"
              >
                Nhận
              </button>

              <button
                onClick={handleReject}
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};




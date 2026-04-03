import React, { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { url } from "../../env.js";


interface ConsultationAdminPageProps {
  setShowCall: (v: boolean) => void;
}

interface User {
  userId: string;
  name: string;
  role: string;
  isCalling: boolean;
}

export const ConsultationAdminPage: React.FC<ConsultationAdminPageProps> = ({ setShowCall }) => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [meCalling, setMeCalling] = useState(false);

  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [isRinging, setIsRinging] = useState(false);

  // 🔊 audio (chỉ tạo 1 lần)
  const [audio] = useState(() => {
    const a = new Audio("/ring.mp3");
    a.loop = true;
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

  // 🚀 start connection + events
  useEffect(() => {
    if (!connection) return;

    connection.start()
      .then(() => {
        console.log("✅ SignalR connected");

        // danh sách online
        connection.on("ReceiveOnlineUsers", (data: User[]) => {
          setUsers(data);
        });

        // incoming call
        connection.on("IncomingCall", (data) => {
          setIncomingCall(data);
          setIsRinging(true);
          audio.play();
        });

        connection.on("CallAccepted", () => {
          setShowCall(true);
        });

        connection.on("CallRejected", () => {
          audio.pause();
          setIsRinging(false);
          setMeCalling(false);
        });

        connection.on("CallTimeout", () => {
          alert("⏳ Không có phản hồi");
          audio.pause();
          setIncomingCall(null);
          setIsRinging(false);
          setMeCalling(false);
        });

        if (isOnline) {
          connection.invoke("Register");
        }
      })
      .catch(err => console.error("❌ SignalR error:", err));

    return () => {
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

  // 📞 gọi
  const handleCall = async (user: User) => {
    if (!connection) return;

    setMeCalling(true);
    await connection.invoke("CallUser", user.userId);
  };

  // ✅ nhận
  const handleAccept = async () => {
    if (!connection || !incomingCall) return;

    audio.pause();
    setIsRinging(false);

    await connection.invoke("AcceptCall", incomingCall.fromUserId);

    setIncomingCall(null);
    setShowCall(true);
  };

  // ❌ từ chối
  const handleReject = async () => {
    if (!connection || !incomingCall) return;

    audio.pause();
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
          Quản lý tư vấn trực tuyến
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
            Danh sách người dùng
          </h2>

          <div className="flex-1 overflow-auto">
            {!isOnline ? (
              <div className="text-center text-gray-500 mt-10">
                Bạn đang offline
              </div>
            ) : users.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                Không có người online
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
        <div className="flex-1 bg-white rounded-2xl shadow p-4 flex flex-col items-center justify-center">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl text-center w-80">
            <h2 className="text-xl font-bold mb-2">📞 Cuộc gọi đến</h2>
            <p>{incomingCall.fromName} đang gọi...</p>

            <div className="flex justify-center gap-4 mt-4">
              <button onClick={handleAccept} className="bg-green-500 text-white px-4 py-2 rounded">
                Nhận
              </button>

              <button onClick={handleReject} className="bg-red-500 text-white px-4 py-2 rounded">
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
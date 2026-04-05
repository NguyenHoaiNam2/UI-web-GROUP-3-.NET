// contexts/SignalRContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { getSignalRConnection } from "../../app/services/signalr";

interface User {
  userId: string;
  name: string;
  role: string;
  isCalling: boolean;
}

interface IncomingCallData {
  fromUserId: string;
  fromName: string;
  // thêm các field khác nếu server trả về
}

interface SignalRContextType {
  users: User[];
  isOnline: boolean;
  meCalling: boolean;
  incomingCall: IncomingCallData | null;
  toggleOnline: () => Promise<void>;
  callUser: (userId: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  isConnected: boolean;
}

const SignalRContext = createContext<SignalRContextType | null>(null);

export const SignalRProvider: React.FC<{
  children: ReactNode;
  isAuthenticated: boolean;
}> = ({ children, isAuthenticated }) => {
  const connection = getSignalRConnection();

  const [users, setUsers] = useState<User[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    const saved = localStorage.getItem("isOnline");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [meCalling, setMeCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const isMountedRef = useRef(true);
  const hasRegisteredRef = useRef(false);
  const listenersSetupRef = useRef(false);

  // Lưu isOnline vào localStorage
  useEffect(() => {
    localStorage.setItem("isOnline", JSON.stringify(isOnline));
  }, [isOnline]);

  // ====================== 1. Start Connection & Register ======================
  useEffect(() => {
    if (!isAuthenticated || !connection) return;

    isMountedRef.current = true;

    const initialize = async () => {
      try {
        if (connection.state === "Disconnected") {
          await connection.start();
          console.log("✅ SignalR connected successfully");
          setIsConnected(true);
        }

        if (isOnline && !hasRegisteredRef.current) {
          await connection.invoke("Register");
          hasRegisteredRef.current = true;
          console.log("🟢 Registered (Context)");
        }
      } catch (err) {
        console.error("❌ SignalR initialize error:", err);
      }
    };

    initialize();

    return () => {
      isMountedRef.current = false;
    };
  }, [connection, isAuthenticated, isOnline]);

  // ====================== 2. Setup Listeners (chỉ 1 lần) ======================
  useEffect(() => {
    if (!connection || listenersSetupRef.current) return;

    listenersSetupRef.current = true;

    // Off trước để tránh duplicate
    connection.off("ReceiveOnlineUsers");
    connection.off("CallAccepted");
    connection.off("CallRejected");
    connection.off("CallTimeout");
    connection.off("IncomingCall");
    connection.off("CallTimeoutForReceiver");

    connection.on("ReceiveOnlineUsers", (onlineUsers: User[]) => {
      if (isMountedRef.current) setUsers(onlineUsers);
    });

    connection.on("CallAccepted", () => {
      if (isMountedRef.current) setMeCalling(false);
    });

    connection.on("CallRejected", () => {
      if (isMountedRef.current) setMeCalling(false);
    });

    connection.on("CallTimeout", () => {
      if (isMountedRef.current) {
        setMeCalling(false);
        alert("Cuộc gọi không có phản hồi (timeout)");
      }
    });

    connection.on("IncomingCall", (data: IncomingCallData) => {
      if (isMountedRef.current) {
        setIncomingCall(data);
      }
    });

    connection.on("CallTimeoutForReceiver", () => {
      if (isMountedRef.current) {
        setIncomingCall(null);
      }
    });

    console.log("📡 SignalR listeners setup completed (Context)");

    return () => {
      listenersSetupRef.current = false;
    };
  }, [connection]);

  // ====================== Toggle Online ======================
  const toggleOnline = async () => {
    if (!connection) return;
    const newStatus = !isOnline;

    try {
      if (connection.state !== "Connected") await connection.start();

      if (newStatus) {
        hasRegisteredRef.current = false;
        await connection.invoke("Register");
        hasRegisteredRef.current = true;
      } else {
        await connection.invoke("SetOffline");
      }

      setIsOnline(newStatus);
    } catch (err) {
      console.error("❌ Toggle online error:", err);
    }
  };

  // ====================== Call User ======================
  const callUser = async (userId: string) => {
    if (!connection || !isOnline || meCalling) return;
    setMeCalling(true);
    try {
      await connection.invoke("CallUser", userId);
    } catch (err) {
      console.error("❌ CallUser error:", err);
      setMeCalling(false);
    }
  };

  // ====================== Accept / Reject (dùng cho GlobalCallHandler) ======================
  const acceptCall = async () => {
    if (!connection || !incomingCall) return;
    try {
      await connection.invoke("AcceptCall", incomingCall.fromUserId);
      setIncomingCall(null);
    } catch (err) {
      console.error(err);
    }
  };

  const rejectCall = async () => {
    if (!connection || !incomingCall) return;
    try {
      await connection.invoke("RejectCall", incomingCall.fromUserId);
      setIncomingCall(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Cleanup khi logout hoặc unmount
  useEffect(() => {
    if (!isAuthenticated) {
      hasRegisteredRef.current = false;
      setUsers([]);
      setIncomingCall(null);
      setMeCalling(false);
    }
  }, [isAuthenticated]);

  const value: SignalRContextType = {
    users,
    isOnline,
    meCalling,
    incomingCall,
    toggleOnline,
    callUser,
    acceptCall,
    rejectCall,
    isConnected,
  };

  return <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>;
};

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error("useSignalR must be used within a SignalRProvider");
  }
  return context;
};
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
    isInCall: boolean;
    toggleOnline: () => Promise<void>;
    callUser: (userId: string) => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: () => Promise<void>;
    endCall: () => Promise<void>;
    cancelCall: () => Promise<void>;
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
    const [isInCall, setIsInCall] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const isMountedRef = useRef(true);
    const hasRegisteredRef = useRef(false);

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

    // ====================== 2. Setup Listeners (chỉ 1 lần - ĐÃ SỬA) ======================
    useEffect(() => {
        if (!connection) return;

        // Off tất cả listener trước khi đăng ký lại (rất quan trọng)
        const events = [
            "ReceiveOnlineUsers",
            "CallAccepted",
            "CallRejected",
            "CallTimeout",
            "IncomingCall",
            "CallTimeoutForReceiver",
            "CallEnded"
        ];

        events.forEach(event => {
            connection.off(event);
        });


        // Đăng ký lại listeners
        connection.on("ReceiveOnlineUsers", (onlineUsers: User[]) => {
            if (isMountedRef.current) setUsers(onlineUsers);
        });

        connection.on("CallAccepted", () => {
            if (isMountedRef.current) {
                setMeCalling(false);
                setIsInCall(true);
                console.log("📞 Cuộc gọi đã được chấp nhận - Mở CallLayout");
            }
        });

        connection.on("CallRejected", () => {
            if (!isMountedRef.current) return;

            console.log("📴 Nhận được CallRejected từ server");

            setIncomingCall(null);
            setMeCalling(false);           // ← Quan trọng cho bên gọi
            setIsInCall(false);
        });

        connection.on("CallTimeout", () => {
            if (isMountedRef.current) {
                setMeCalling(false);
                setIsInCall(false);
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

        connection.on("CallEnded", () => {
            if (!isMountedRef.current) return;

            console.log("📴 Nhận được CallEnded từ server");
            setIsInCall(false);
        });

        // Cleanup khi effect unmount
        return () => {
            events.forEach(event => connection.off(event));
        };
    }, [connection]);   // Chỉ phụ thuộc vào connection

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

            // Reset tất cả trạng thái liên quan
            setIncomingCall(null);
            setMeCalling(false);           // ← Quan trọng: reset cho bên gọi
            setIsInCall(false);

            console.log("✅ Đã reject cuộc gọi và reset trạng thái");
        } catch (err) {
            console.error("RejectCall error:", err);
        }
    };
    // Cancel từ bên gọi (huỷ cuộc gọi đang chờ)
    const cancelCall = async () => {
        if (!connection) return;
        try {
            // Bên gọi huỷ không cần truyền fromUserId, server sẽ lấy từ Context.ConnectionId
            await connection.invoke("CancelCall");   // ← Gọi method mới trên server

            setMeCalling(false);
            setIncomingCall(null);
            setIsInCall(false);

            console.log("✅ Bên gọi đã huỷ cuộc gọi");
        } catch (err) {
            console.error("CancelCall error:", err);
        }
    };
    // Hàm kết thúc cuộc gọi
    const endCall = async () => {
        if (!connection) return;
        try {
            console.log("🔴 [Context] Invoking EndCall to server...");
            await connection.invoke("EndCall");
            console.log("✅ [Context] EndCall invoked successfully");
        } catch (err) {
            console.error("❌ EndCall invoke error:", err);
            setIsInCall(false);
        }
    };

    // Cleanup khi logout hoặc unmount
    useEffect(() => {
        if (!isAuthenticated) {
            hasRegisteredRef.current = false;
            setUsers([]);
            setIncomingCall(null);
            setMeCalling(false);
            setIsInCall(false);
        }
    }, [isAuthenticated]);

    const value: SignalRContextType = {
        users,
        isOnline,
        meCalling,
        incomingCall,
        isInCall,
        toggleOnline,
        callUser,
        acceptCall,
        rejectCall,
        endCall,
        cancelCall,
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
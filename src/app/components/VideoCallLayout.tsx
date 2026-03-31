import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import "../../styles/VideoCallLayout.css";

interface Message {
    text: string;
    fromUser: boolean; // true = user, false = API/other
}

interface Props {
    onEndCall: () => void;
    onMinimize: () => void; // thêm prop
}

const VideoCallLayout: React.FC<Props> = ({ onEndCall, onMinimize }) => {

    const [autoScroll, setAutoScroll] = useState(true); // chế độ auto-scroll
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [isSharing, setIsSharing] = useState(false);

    const [userSpeaking, setUserSpeaking] = useState(true);
    const [otherSpeaking, setOtherSpeaking] = useState(false);

    // Chat
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");

    const sendMessage = () => {
        if (!inputText.trim()) return;

        // Gửi message từ user
        setMessages([...messages, { text: inputText, fromUser: true }]);
        setInputText("");

        // Giả lập nhận tin nhắn từ API/other sau 1s
        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                { text: "Reply: " + inputText, fromUser: false },
            ]);
        }, 1000);
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") sendMessage();
    };

    useEffect(() => {
        if (autoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, autoScroll]);

    return (
        <div className="call-container">
            {/* MAIN */}
            <div className="main">
                <div className="main-label">Share Screen or Cam Other</div>

                <div className="controls">
                    <button onClick={() => setIsCamOn(!isCamOn)}>
                        {isCamOn ? "Turn Off Cam" : "Turn On Cam"}
                    </button>

                    <button onClick={() => setIsMicOn(!isMicOn)}>
                        {isMicOn ? "Mute Mic" : "Unmute Mic"}
                    </button>

                    <button onClick={() => setIsSharing(!isSharing)}>
                        {isSharing ? "Stop Share" : "Share Screen"}
                    </button>

                    <button
                        onClick={() => {
                            setUserSpeaking(!userSpeaking);
                            setOtherSpeaking(!otherSpeaking);
                        }}
                    >
                        Test Voice
                    </button>
                    <button onClick={onMinimize}>
                        🔽 Thu nhỏ
                    </button>
                    <button className="end-call" onClick={onEndCall}>
                        End Call
                    </button>
                </div>
            </div>

            {/* SIDEBAR */}
            <div className="sidebar">
                <div className="chat-box">
                    <div className="title">Khung Trò Chuyện
                        <button
                            className={`auto-scroll-btn ${autoScroll ? "on" : "off"}`}
                            onClick={() => setAutoScroll(!autoScroll)}
                        >
                            {autoScroll ? "Auto" : "Auto"}
                        </button>
                    </div>
                    <div className="messages">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`message ${msg.fromUser ? "left" : "right"}`}
                            >
                                {msg.text}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-input">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Nhập tin nhắn..."
                        />
                        <button onClick={sendMessage} className="send-btn">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                fill="white"
                            >
                                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="voice-box">
                    <div className="voice-item">
                        <span>Voice của họ</span>
                        <div className={`wave ${otherSpeaking ? "active" : ""}`} />
                    </div>

                    <div className="voice-item">
                        <span>Voice của bạn</span>
                        <div className={`wave ${userSpeaking ? "active" : ""}`} />
                    </div>
                </div>

                <div className="cam-user">
                    <div className="title">Màn hình</div>
                </div>
            </div>
        </div>
    );
};

export default VideoCallLayout;
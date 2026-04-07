import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import "../../styles/VideoCallLayout.css";
import { useSignalR } from "../contexts/SignalRContext";
import { useMicHook } from "../hooks/useMicHook";
import { useWebRTC } from "../hooks/useWebRTCHook";
import { useAudioVisualizer } from "../hooks/useAudioVisualizer";
import { useWebcamHook } from "../hooks/useWebcamHook";

interface Props {
    onEndCall: () => void;
    onMinimize: () => void; // thêm prop
}

const VideoCallLayout: React.FC<Props> = ({ onEndCall, onMinimize }) => {

    // === Webcam Hook ===
    const { isCamOn, toggleWebcam, localStream, videoRef, error } = useWebcamHook();
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const { chatMessages, sendMessage: sendMessageFromContext, currentCallPartnerId, currentCallCallerId, isInCall } = useSignalR();
    const { toggleMute, isMuted, remoteVideoStream, remoteAudioStream, cleanup } = useWebRTC(currentCallPartnerId, isInCall, currentCallCallerId, localStream);





    const [isSharing, setIsSharing] = useState(false);
    const [isViewingScreen, setIsViewingScreen] = useState(false);
    //Voice
    const barsRef = useRef<HTMLDivElement[]>([]);
    const { toggleMic } = useMicHook(barsRef);
    const remoteBarsRef = useRef<HTMLDivElement[]>([]);
    const { } = useAudioVisualizer(remoteAudioStream, remoteBarsRef);
    // Chat
    const [autoScroll, setAutoScroll] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [inputText, setInputText] = useState("");



    const handleSendMessage = () => {
        if (!inputText.trim()) return;
        const text = inputText.trim();
        // Gửi tin nhắn thật lên server
        sendMessageFromContext(text);
        // Xóa ô nhập
        setInputText("");
    };

    const handleMic = () => {
        toggleMic();
        toggleMute();
    };
    const handleEndCall = async () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        cleanup();
        onEndCall();
    };
    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleSendMessage();
    };

    useEffect(() => {
        if (autoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, autoScroll]);

    useEffect(() => {
        const video = remoteVideoRef.current;
        if (!video) return;

        if (remoteVideoStream) {
            video.srcObject = remoteVideoStream;
        } else {
            video.srcObject = null;
            video.load(); // 🔥 BẮT BUỘC để clear frame
        }
    }, [remoteVideoStream]);
    return (
        <div className="call-container">
            {/* MAIN */}
            <div className="main">
                <div className="main-label">Màn hình người kia</div>

                <div className="remote-view-container">
                    {/* Khu vực hiển thị video / screenshare của người kia */}
                    <div className="remote-video-wrapper">
                        {isViewingScreen ? (
                            <div className="remote-screen">
                                {/* Sau này bạn sẽ truyền remoteScreenStream vào đây */}
                                <div className="placeholder-screen">
                                    <p> Đang xem màn hình chia sẻ của người kia</p>
                                    <small>Chưa nhận được stream</small>
                                </div>
                            </div>
                        ) : (
                            <div className="remote-camera">
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className={`remote-video ${!remoteVideoStream ? "hidden" : ""}`}
                                />

                                {!remoteVideoStream && (
                                    <div className="no-remote-video">
                                        <p>📷 Camera của người kia đang tắt</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="controls">
                    <button onClick={toggleWebcam}>
                        {isCamOn ? "Tắt Camera" : "Bật Camera"}
                    </button>

                    <button onClick={handleMic}>
                        {isMuted ? "Bật Micro" : "Tắt Micro"}
                    </button>

                    <button onClick={() => setIsSharing(!isSharing)}>
                        {isSharing ? "Dừng Chia Sẻ" : "Chia Sẻ Màn Hình"}
                    </button>

                    <button
                        onClick={() => setIsViewingScreen(!isViewingScreen)}
                        className={`view-toggle-btn ${isViewingScreen ? 'viewing-screen' : 'viewing-camera'}`}
                    >
                        {isViewingScreen
                            ? "Xem Camera"
                            : "Xem Màn Hình Chia Sẻ"
                        }
                    </button>

                    <button onClick={onMinimize}>
                        Thu nhỏ màn hình
                    </button>
                    <button onClick={handleEndCall}>
                        Kết Thúc Cuộc Gọi
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
                            {autoScroll ? "Auto Scroll" : "Auto Scroll"}
                        </button>
                    </div>
                    <div className="messages">
                        {chatMessages.map((msg, idx) => {
                            const isMyMessage = msg.fromUserId === "me" || msg.fromName === "Bạn";

                            return (
                                <div
                                    key={idx}
                                    className={`message ${isMyMessage ? "left" : "right"}`}
                                >
                                    <strong>{msg.fromName}:</strong> {msg.text}
                                </div>
                            );
                        })}
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
                        <button onClick={handleSendMessage} className="send-btn">
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
                        <div className="wave-bars">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div
                                    key={i}
                                    ref={(el) => {
                                        if (el) remoteBarsRef.current[i] = el;
                                    }}
                                    className="bar"
                                />
                            ))}
                        </div>
                    </div>

                    <div className="voice-item">
                        <span>Voice của bạn</span>
                        <div className="wave-bars">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div
                                    key={i}
                                    ref={(el) => {
                                        barsRef.current[i] = el!;
                                    }}
                                    className="bar"
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* === CAMERA SECTION === */}
                <div className="cam-user">
                    <div className="title">Camera của bạn</div>

                    <div className="cam-container">
                        {isCamOn && localStream ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="local-video"
                            />
                        ) : (
                            <div className="cam-off">
                                <div className="cam-off-icon">📷</div>
                                <p>Webcam đang tắt</p>
                                <small>Nhấn "Bật Camera" để bật</small>
                            </div>
                        )}
                        {error && <div className="cam-error">{error}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCallLayout;
import { useState, useRef, useEffect, useCallback } from 'react';

export const useWebcamHook = () => {
    const [isCamOn, setIsCamOn] = useState(false);           // Mặc định tắt khi mới vào call
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Bật/Tắt webcam
    const toggleWebcam = useCallback(async () => {
        try {
            if (isCamOn) {
                // Tắt webcam
                if (localStream) {
                    localStream.getTracks().forEach(track => track.stop());
                }
                setLocalStream(null);
                setIsCamOn(false);
                setError(null);
            } else {
                // Bật webcam
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        facingMode: "user",
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false   // audio sẽ để mic hook xử lý riêng
                });

                setLocalStream(stream);
                setIsCamOn(true);
                setError(null);

                // Gán stream vào video element (nếu đã mount)
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }
        } catch (err: any) {
            console.error("Webcam error:", err);
            setError(err.message || "Không thể truy cập webcam");
            setIsCamOn(false);
        }
    }, [isCamOn, localStream]);

    // Cleanup khi component unmount
    useEffect(() => {
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [localStream]);

    // Cập nhật video element khi localStream thay đổi
    useEffect(() => {
        if (videoRef.current && localStream) {
            videoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    return {
        isCamOn,
        toggleWebcam,
        localStream,
        videoRef,
        error
    };
};
import { useState, useRef, useEffect, useCallback } from 'react';

export const useWebcamHook = () => {
    const [isCamOn, setIsCamOn] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [error, setError] = useState<string | null>(null);

    const toggleWebcam = useCallback(async (): Promise<MediaStream | null> => {
        try {
            // ===================== TẮT CAMERA =====================
            if (isCamOn && localStream) {
                const videoTrack = localStream.getVideoTracks()[0];
                if (videoTrack) {
                    videoTrack.enabled = false;   // chỉ disable, không stop
                }
                setIsCamOn(false);

                // Không return null để useWebRTC vẫn replaceTrack(null)
                return localStream;
            }

            // ===================== BẬT CAMERA =====================
            // Luôn tạo stream MỚI khi bật (giải quyết triệt để preview đen)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            // Stop stream cũ nếu có
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }

            setLocalStream(stream);
            setIsCamOn(true);
            setError(null);

            // Force set vào local video
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => {});
            }

            return stream;

        } catch (err: any) {
            console.error("Webcam error:", err);
            setError(err.message || "Không thể truy cập webcam");
            setIsCamOn(false);
            return null;
        }
    }, [isCamOn, localStream]);

    // Cleanup khi unmount
    useEffect(() => {
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [localStream]);

    return {
        isCamOn,
        toggleWebcam,
        localStream,
        videoRef,
        error
    };
};
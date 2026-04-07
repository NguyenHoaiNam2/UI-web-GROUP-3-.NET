import { useState, useRef, useCallback, useEffect } from "react";

export const useShareScreenHook = () => {
    const [isSharing, setIsSharing] = useState(false);
    const screenStreamRef = useRef<MediaStream | null>(null);

    const startShareScreen = useCallback(async (): Promise<MediaStream | null> => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false
            });

            const track = stream.getVideoTracks()[0];
            if (!track) return null;

            track.onended = () => {
                console.log("🛑 Chrome Stop Sharing triggered");
                stopShareScreenInternal();
            };

            screenStreamRef.current = stream;
            setIsSharing(true);
            return stream;
        } catch (err) {
            console.error("Share screen error:", err);
            return null;
        }
    }, []);

    const stopShareScreenInternal = useCallback(() => {
        if (!screenStreamRef.current) return;

        const tracks = screenStreamRef.current.getVideoTracks();

        tracks.forEach(track => {
            track.enabled = false;
            try {
                track.stop();
            } catch (e) {}
        });

        screenStreamRef.current = null;
        setIsSharing(false);
    }, []);

    const stopShareScreen = stopShareScreenInternal;

    // Cleanup khi reload / đóng tab / unmount
    useEffect(() => {
        const cleanupScreen = () => {
            if (screenStreamRef.current) {
                console.log("🧹 Page unload → force stop screen sharing");
                const tracks = screenStreamRef.current.getVideoTracks();
                tracks.forEach(track => {
                    try { track.stop(); } catch (e) {}
                });
                screenStreamRef.current = null;
            }
        };

        window.addEventListener('beforeunload', cleanupScreen);
        window.addEventListener('unload', cleanupScreen);

        return () => {
            cleanupScreen(); // cleanup khi hook unmount
            window.removeEventListener('beforeunload', cleanupScreen);
            window.removeEventListener('unload', cleanupScreen);
        };
    }, []);

    return {
        isSharing,
        startShareScreen,
        stopShareScreen,
        screenStream: screenStreamRef.current
    };
};
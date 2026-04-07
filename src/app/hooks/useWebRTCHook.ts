import { useEffect, useRef, useState } from "react";
import { useSignalR } from "../contexts/SignalRContext";

export const useWebRTC = (
    partnerId: string | null,
    isInCall: boolean,
    callerId: string | null,
    localVideoStream?: MediaStream | null
) => {
    const {
        connection,
        sendOffer,
        sendAnswer,
        sendIceCandidate
    } = useSignalR();

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const startedRef = useRef(false);
    const isEffectRunningRef = useRef(false);
    const iceQueue = useRef<RTCIceCandidateInit[]>([]);
    const myUserId = localStorage.getItem("userId");
    const isCaller = myUserId === callerId;

    const [remoteAudioStream, setRemoteAudioStream] = useState<MediaStream | null>(null);
    const [remoteVideoStream, setRemoteVideoStream] = useState<MediaStream | null>(null);

    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const audioTrackRef = useRef<MediaStreamTrack | null>(null);

    const [isMuted, setIsMuted] = useState(false);

    const toggleMute = () => {
        if (!audioTrackRef.current) return;

        audioTrackRef.current.enabled = !audioTrackRef.current.enabled;

        setIsMuted(!audioTrackRef.current.enabled);
    };
    const setupLocalAudio = async (pc: RTCPeerConnection) => {
        // Bảo vệ chặt chẽ hơn
        if (audioTrackRef.current?.readyState === 'live' || localStreamRef.current) {
            return;
        }

        try {
            console.log("🔴 Calling getUserMedia now - should show permission prompt");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Kiểm tra lại sau khi await (phòng race condition)
            if ((audioTrackRef.current?.readyState as string) === 'live' || localStreamRef.current) {
                // Cleanup stream mới nếu đã có audio rồi
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            localStreamRef.current = stream;
            const audioTrack = stream.getAudioTracks()[0];

            if (!audioTrack) return;

            audioTrackRef.current = audioTrack;
            audioTrack.enabled = false;
            setIsMuted(true);

            pc.addTrack(audioTrack, stream);

            console.log("🎤 Local audio added");
        } catch (err) {
            console.error("❌ getUserMedia error:", err);
        }
    };
    // ===================== INIT PEER =====================
    const createPeer = () => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" }
            ]
        });

        pc.ontrack = (event) => {
            const track = event.track;

            console.log("🎯 Track received:", track.kind);

            if (track.kind === "audio") {
                const audioStream = new MediaStream([track]);
                setRemoteAudioStream(audioStream);

                if (!remoteAudioRef.current) {
                    remoteAudioRef.current = new Audio();
                }

                remoteAudioRef.current.srcObject = audioStream;
                remoteAudioRef.current.play().catch(err => {
                    console.warn("Audio play error:", err);
                });
            }

            if (track.kind === "video") {
                const videoStream = new MediaStream([track]);
                setRemoteVideoStream(videoStream);

                // 🔥 QUAN TRỌNG: detect khi track bị stop
                track.onended = () => {
                    console.log("📴 Remote video track ended");
                    setRemoteVideoStream(null);
                };
            }
        };

        pc.ondatachannel = (event) => {
            console.log("📦 DataChannel received");

            const channel = event.channel;

            channel.onopen = () => {
                console.log("✅ DataChannel OPEN");
            };
        };

        // ICE candidate
        pc.onicecandidate = (event) => {
            if (event.candidate && partnerId) {

                sendIceCandidate({
                    candidate: event.candidate,
                    toUserId: partnerId
                });
            }
        };

        // Connection state
        pc.onconnectionstatechange = () => {
        console.log("🔗 Connection state changed:", pc.connectionState);

        if (pc.connectionState === "disconnected" || 
            pc.connectionState === "failed" || 
            pc.connectionState === "closed") {
            
            console.log("🛑 Remote peer disconnected (F5 hoặc đóng tab)");
            setRemoteVideoStream(null);     // Xóa video remote ngay
            setRemoteAudioStream(null);     // Xóa audio remote (nếu có)
        }
    };
        return pc;
    };

    // ===================== RECEIVER =====================
    const handleReceiveOffer = async (data: any) => {
        console.log("📥 Received Offer");

        let pc = pcRef.current;
        if (!pc) {
            pc = createPeer();
            pcRef.current = pc;
        }

        // Guard cực mạnh + async safe
        if (audioTrackRef.current || localStreamRef.current) {
        } else {
            await setupLocalAudio(pc);
        }

        try {
            await pc.setRemoteDescription({
                type: "offer",
                sdp: data.sdp
            });

            // Drain ICE queue
            for (const ice of iceQueue.current) {
                await pc.addIceCandidate(ice).catch(e => console.warn("ICE add error", e));
            }
            iceQueue.current = [];

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            console.log("📤 Send Answer");

            await sendAnswer({
                sdp: answer.sdp,
                toUserId: data.fromUserId
            });
        } catch (err) {
            console.error("❌ Error handling offer:", err);
        }
    };

    const handleReceiveAnswer = async (data: any) => {
        console.log("📥 Received Answer");

        await pcRef.current?.setRemoteDescription({
            type: "answer",
            sdp: data.sdp
        });
        for (const ice of iceQueue.current) {
            await pcRef.current?.addIceCandidate({
                candidate: ice.candidate,
                sdpMid: ice.sdpMid,
                sdpMLineIndex: ice.sdpMLineIndex
            });
        }
        iceQueue.current = [];
    };

    const handleReceiveIce = async (data: any) => {

        const pc = pcRef.current;
        if (!pc) {
            console.log("⏳ Queue ICE (no peer yet)");
            iceQueue.current.push(data);
            return;
        }

        if (!pc.remoteDescription) {
            iceQueue.current.push(data);
            return;
        }

        try {
            await pc.addIceCandidate({
                candidate: data.candidate,
                sdpMid: data.sdpMid,
                sdpMLineIndex: data.sdpMLineIndex
            });
        } catch (err) {
            console.error("❌ ICE error:", err);
        }
    };
    // ===================== VIDEO TRACK MANAGEMENT =====================
    const videoSenderRef = useRef<RTCRtpSender | null>(null);

    useEffect(() => {
        const pc = pcRef.current;
        if (!pc) return;

        // Trường hợp tắt video hoàn toàn
        if (!localVideoStream) {
            if (videoSenderRef.current) {
                console.log("📴 replaceTrack(null) - tắt video");
                videoSenderRef.current.replaceTrack(null).catch(console.error);
            }
            return;
        }

        // Có stream video (camera hoặc screen)
        const videoTrack = localVideoStream.getVideoTracks()[0];
        if (!videoTrack) return;

        const processVideo = async () => {
            try {
                if (videoSenderRef.current) {
                    console.log("🔁 replaceTrack video");
                    await videoSenderRef.current.replaceTrack(videoTrack);
                    return;
                }

                // Chỉ addTrack lần đầu tiên trong suốt cuộc gọi
                console.log("📹 addTrack video lần đầu");
                const sender = pc.addTrack(videoTrack, localVideoStream);
                videoSenderRef.current = sender;

                // Renegotiate chỉ 1 lần
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                if (partnerId) {
                    await sendOffer({ sdp: offer.sdp, toUserId: partnerId });
                }
            } catch (err) {
                console.error("❌ Video track error:", err);
            }
        };

        processVideo();
    }, [localVideoStream, partnerId, connection, sendOffer]);   // dependencies rõ ràng
    // ===================== SIGNALR LISTENER =====================
    useEffect(() => {
        if (!connection) return;

        connection.on("ReceiveOffer", handleReceiveOffer);
        connection.on("ReceiveAnswer", handleReceiveAnswer);
        connection.on("ReceiveIceCandidate", handleReceiveIce);

        return () => {
            connection.off("ReceiveOffer", handleReceiveOffer);
            connection.off("ReceiveAnswer", handleReceiveAnswer);
            connection.off("ReceiveIceCandidate", handleReceiveIce);
        };
    }, [connection]);
    //Auto CONNECT khi isInCall = true và có partnerId
    useEffect(() => {
        if (!partnerId || !isInCall) return;

        if (startedRef.current || isEffectRunningRef.current) {
            console.log("⛔ Already started or running (StrictMode protection)");
            return;
        }

        isEffectRunningRef.current = true;
        startedRef.current = true;

        console.log("🚀 START WEBRTC");

        const start = async () => {
            if (pcRef.current) {
                console.warn("⚠️ Peer already exists");
                return;
            }

            const pc = createPeer();
            pcRef.current = pc;

            await setupLocalAudio(pc);

            if (isCaller) {
                console.log("📞 I am CALLER → createOffer");
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                await sendOffer({
                    sdp: offer.sdp,
                    toUserId: partnerId
                });
            } else {
                console.log("📞 I am RECEIVER → wait for offer");
            }
        };

        start().catch(err => console.error("Start WebRTC error:", err));

        return () => {
            isEffectRunningRef.current = false;   // Quan trọng cho StrictMode
        };
    }, [isInCall, partnerId, isCaller, sendOffer]);

    // Cleanup khi call kết thúc
    const cleanup = () => {
        console.log("🔴 END CALL - Full cleanup");

        startedRef.current = false;
        isEffectRunningRef.current = false;

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        if (audioTrackRef.current) {
            audioTrackRef.current.stop();
            audioTrackRef.current = null;
        }

        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
            remoteAudioRef.current = null;
        }

        if (pcRef.current) {
            pcRef.current.getSenders().forEach(sender => sender.track?.stop());
            pcRef.current.close();
            pcRef.current = null;
        }

        iceQueue.current = [];
    };

    useEffect(() => {
        if (!isInCall) cleanup();
    }, [isInCall]);

    useEffect(() => {
        const pc = pcRef.current;
        if (!pc) return;

        const handleStateChange = () => {
            console.log("🔗 Connection state:", pc.connectionState);
            if (pc.connectionState === "connected") {
                console.log("✅ WebRTC CONNECTED");
            }
            if (pc.connectionState === "failed") {
                console.warn("❌ WebRTC FAILED → cleanup");
                cleanup();
            }
        };

        pc.onconnectionstatechange = handleStateChange;

        return () => {
            pc.onconnectionstatechange = null;
        };
    }, []);

    return {
        isMuted,
        toggleMute,
        remoteAudioStream,
        remoteVideoStream,
        cleanup
    };
};
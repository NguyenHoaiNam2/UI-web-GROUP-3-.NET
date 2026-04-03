// hooks/useSignalR.ts
import { useEffect, useState } from "react";
import { getSignalRConnection } from "../services/signalr";
import * as signalR from "@microsoft/signalr";

export const useSignalR = () => {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const conn = getSignalRConnection();
    setConnection(conn);

    const start = async () => {
      if (conn.state === "Disconnected") {
        try {
          await conn.start();
          console.log("✅ Global SignalR connected");
          setConnected(true);
        } catch (err) {
          console.error("❌ SignalR error:", err);
        }
      } else {
        setConnected(true);
      }
    };

    start();

    // ❌ KHÔNG stop connection ở đây nữa
  }, []);

  return { connection, connected };
};
// services/signalr.ts
import * as signalR from "@microsoft/signalr";
import { url } from "../../env";

let connection: signalR.HubConnection | null = null;

export const getSignalRConnection = () => {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(url + "consultationHub", {
        accessTokenFactory: () => localStorage.getItem("accessToken") || ""
      })
      .withAutomaticReconnect()
      .build();
  }
  return connection;
};
export const resetSignalRConnection = () => {
  if (connection) {
    connection.stop().catch(() => { });
    connection = null;
  }
};
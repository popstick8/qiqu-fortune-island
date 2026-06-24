import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@monopoly/shared";

export const serverUrl = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(serverUrl, {
  autoConnect: true,
  transports: ["websocket", "polling"]
});

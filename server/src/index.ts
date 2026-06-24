import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import os, { type NetworkInterfaceInfo } from "os";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@monopoly/shared";
import { registerSocketHandlers } from "./socket";

dotenv.config();

interface InterServerEvents {}
interface SocketData {
  roomId?: string;
  playerId?: string;
}

const app = express();
const port = Number(process.env.PORT ?? 4000);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const corsOrigin = clientOrigin === "*" ? true : clientOrigin.split(",").map((origin) => origin.trim());

function localIPv4Addresses(): string[] {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((item): item is NetworkInterfaceInfo => item !== undefined)
    .filter((item) => item.family === "IPv4" && !item.internal)
    .map((item) => item.address);
}

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true, name: "monopoly-online-server" });
});

app.get("/network-info", (_request, response) => {
  const localAddresses = localIPv4Addresses();
  response.json({
    port,
    clientOrigin,
    localAddresses,
    localUrls: localAddresses.map((address) => `http://${address}:${port}`)
  });
});

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  server,
  {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"]
    }
  }
);

registerSocketHandlers(io);

server.listen(port, () => {
  console.log(`Monopoly server listening on http://localhost:${port}`);
  for (const address of localIPv4Addresses()) {
    console.log(`Monopoly server LAN URL http://${address}:${port}`);
  }
});

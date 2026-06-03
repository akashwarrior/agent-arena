export * from "@bufbuild/protobuf";
export * from "./game_pb";

export const WORLD = {
  width: 1600,
  height: 1000,
} as const;

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

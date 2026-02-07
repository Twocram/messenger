// ========== User ==========

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

// ========== Message ==========

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessageDto {
  chatId: string;
  content: string;
}

// ========== Chat ==========

export interface Chat {
  id: string;
  name: string | null;
  isGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChatDto {
  name?: string;
  participantIds: string[];
}

// ========== WebSocket Events ==========

export type WsClientEvent =
  | { type: "message:send"; payload: SendMessageDto }
  | { type: "message:typing"; payload: { chatId: string } };

export type WsServerEvent =
  | { type: "message:new"; payload: Message }
  | { type: "message:typing"; payload: { chatId: string; userId: string } }
  | { type: "error"; payload: { message: string } };

// ========== API Response ==========

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Convert http/https to ws/wss for websocket URL
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

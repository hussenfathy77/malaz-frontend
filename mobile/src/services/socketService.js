import { Platform } from 'react-native';
import { io } from 'socket.io-client';
import { getStoredToken } from '../config/api';

const DEV_LAN_IP = '192.168.1.24';

const getSocketUrl = () => {
  return Platform.OS === 'web'
    ? 'http://localhost:3000'
    : `http://${DEV_LAN_IP}:3000`;
};

let socket = null;

export const socketService = {
  /**
   * Connect to the Socket.io server
   */
  async connect() {
    if (socket && socket.connected) return socket;

    const token = await getStoredToken();
    const url = getSocketUrl();

    socket = io(url, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    return socket;
  },

  /**
   * Join a SafeCircle chat room to receive real-time messages
   */
  async joinCircleRoom(circleId) {
    const s = await this.connect();
    s.emit('join-circle', circleId);
  },

  /**
   * Leave a SafeCircle chat room
   */
  leaveCircleRoom(circleId) {
    if (socket) {
      socket.emit('leave-circle', circleId);
    }
  },

  /**
   * Listen for new messages in a circle
   * @param {function} callback - called with the message object
   * @returns {function} unsubscribe function
   */
  onNewMessage(callback) {
    if (!socket) return () => {};
    socket.on('new-message', callback);
    return () => socket.off('new-message', callback);
  },

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  isConnected() {
    return socket?.connected || false;
  },
};

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const API_URL = process.env.REACT_APP_API_URL || '';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || API_URL.replace(/\/api$/, '') || '';

export function SocketProvider({ children }) {
  const { getToken } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const connect = () => {
    if (socketRef.current?.connected) return socketRef.current;
    const token = getToken();
    if (!token) return null;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socketRef.current = socket;
    return socket;
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  };

  const getSocket = () => socketRef.current;

  useEffect(() => {
    return () => disconnect();
  }, []);

  return (
    <SocketContext.Provider value={{ connect, disconnect, getSocket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);

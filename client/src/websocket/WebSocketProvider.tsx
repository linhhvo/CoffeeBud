import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import type { WsEventMsg } from "./types";
import { useAuth } from "../context/AuthContext.tsx";

type Listener = (payload: any) => void;

interface WebSocketContextType {
    send: (type: string, payload: any) => void;
    subscribe: (eventType: string, callback: Listener) => () => void;
    isConnected: boolean; // New state exposed to components
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = (
    { children },
) => {
    const { isAuthenticated } = useAuth();

    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const listeners = useRef<Map<string, Set<Listener>>>(new Map());

    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 10;

    useEffect(() => {
        let isMounted = true;

        if (!isAuthenticated) {
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            setIsConnected(false);
            return;
        }
        const connect = () => {
            ws.current = new WebSocket("ws://localhost:8080/ws");

            ws.current.onopen = () => {
                setIsConnected(true);
                reconnectAttempts.current = 0; // Reset attempts on successful connection
                console.log("Connected to the WebSocket server");
            };

            ws.current.onmessage = (event) => {
                try {
                    const data: WsEventMsg = JSON.parse(event.data);

                    console.log(data);

                    const eventListeners = listeners.current.get(
                        data.event_type,
                    );

                    if (eventListeners) {
                        eventListeners.forEach((callback) =>
                            callback(data.event_data)
                        );
                    }
                } catch (error) {
                    console.error("Failed to parse message");
                }
            };

            ws.current.onclose = () => {
                setIsConnected(false);
                console.log("close websocket connection");

                if (
                    isMounted &&
                    isAuthenticated &&
                    reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS
                ) {
                    const timeout = Math.min(
                        10000,
                        1000 * Math.pow(2, reconnectAttempts.current),
                    );

                    reconnectTimeout.current = setTimeout(() => {
                        reconnectAttempts.current += 1;
                        connect();
                    }, timeout);
                }
            };

            ws.current.onerror = () => {
                ws.current?.close();
            };
        };

        connect();

        return () => {
            isMounted = false;

            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            ws.current?.close();
        };
    }, [isAuthenticated]);

    const send = (type: string, payload: any) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type, payload }));
        }
    };

    const subscribe = (eventType: string, callback: Listener) => {
        if (!listeners.current.has(eventType)) {
            listeners.current.set(eventType, new Set());
        }
        listeners.current.get(eventType)!.add(callback);

        return () => {
            listeners.current.get(eventType)?.delete(callback);
        };
    };

    return (
        <WebSocketContext.Provider value={{ send, subscribe, isConnected }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) throw new Error("useWebSocket must be used within Provider");
    return context;
};
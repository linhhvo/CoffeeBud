import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import type { WsEventMsg } from "./types";
import { WsEventTypes } from "./types";
import { useAuth } from "../context/AuthContext.tsx";

type Listener = (payload: any) => void;

export type ConnectionState =
    | "connecting"
    | "connected"
    | "disconnected"
    | "failed";

interface WebSocketContextType {
    send: (type: WsEventTypes, payload: any) => boolean;
    subscribe: (eventType: WsEventTypes, callback: Listener) => () => void;
    connectionState: ConnectionState;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = (
    { children },
) => {
    const { isAuthenticated } = useAuth();

    const [connectionState, setConnectionState] = useState<ConnectionState>(
        "disconnected",
    );
    const ws = useRef<WebSocket | null>(null);
    const listeners = useRef<Map<string, Set<Listener>>>(new Map());

    const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttempts = useRef(0);
    const isMounted = useRef(true);
    const MAX_RECONNECT_ATTEMPTS = 10;

    useEffect(() => {
        isMounted.current = true;

        // if user is not logged in, close the connection if opened
        if (!isAuthenticated) {
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            setConnectionState("disconnected");
            return;
        }

        const connect = () => {
            setConnectionState("connecting");
            ws.current = new WebSocket("ws://localhost:8080/ws");

            ws.current.onopen = () => {
                setConnectionState("connected");
                reconnectAttempts.current = 0;
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
                setConnectionState("disconnected");
                console.log("WebSocket connection closed");

                // do not reattempt if component has been unmounted or user has logged out
                if (!isMounted.current || !isAuthenticated) return;

                // try to reconnect with exponential backoff
                if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                    const timeout = Math.min(
                        10000,
                        1000 * Math.pow(2, reconnectAttempts.current),
                    );
                    reconnectTimeout.current = setTimeout(() => {
                        reconnectAttempts.current += 1;
                        connect();
                    }, timeout);
                } else {
                    setConnectionState("failed");
                    console.warn("WebSocket max reconnect attempts reached");
                }
            };

            ws.current.onerror = () => {
                ws.current?.close();
            };
        };

        connect();

        return () => {
            isMounted.current = false;

            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            ws.current?.close();
        };
    }, [isAuthenticated]);

    const send = (type: WsEventTypes, payload: any): boolean => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type, payload }));
            return true;
        }
        console.warn("WebSocket is not open, message dropped:", type);
        return false;
    };

    const subscribe = (eventType: WsEventTypes, callback: Listener) => {
        if (!listeners.current.has(eventType)) {
            listeners.current.set(eventType, new Set());
        }
        listeners.current.get(eventType)!.add(callback);

        return () => {
            listeners.current.get(eventType)?.delete(callback);
        };
    };

    return (
        <WebSocketContext.Provider value={{ send, subscribe, connectionState }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) throw new Error("useWebSocket must be used within Provider");
    return context;
};
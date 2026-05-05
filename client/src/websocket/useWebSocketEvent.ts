import {useEffect} from "react";
import {useWebSocket} from "./WebSocketProvider";
import type {WsEventType} from "./types";

export function useWebSocketEvent(
    eventType: WsEventType | WsEventType[],
    callback: (payload: any) => void,
) {
    const {subscribe} = useWebSocket();

    useEffect(() => {
        const types = Array.isArray(eventType) ? eventType : [eventType];
        const unsubscribers = types.map((type) => subscribe(type, callback));
        return () => unsubscribers.forEach((fn) => fn()); // clean up callbacks when component unmounts
    }, [eventType, callback]);
}
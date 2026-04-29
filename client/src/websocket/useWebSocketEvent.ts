import {useEffect} from "react";
import {useWebSocket} from "./WebSocketProvider";

export const useWebSocketEvent = <T>(
    eventType: string,
    callback: (payload: T) => void,
) => {
    const {subscribe} = useWebSocket();

    useEffect(() => {
        const unsubscribe = subscribe(eventType, callback);

        return unsubscribe;
    }, [eventType, callback, subscribe]);
};
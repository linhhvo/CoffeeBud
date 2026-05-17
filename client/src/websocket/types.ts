export interface WsEventMsg {
    event_type: WsEventType;
    event_data: any;
}

export const WsEventTypes = {
    NEW_DEVICE: "NEW_DEVICE",
    DEVICE_PAIRED: "DEVICE_PAIRED",
    DEVICE_UPDATED: "DEVICE_UPDATED",
    DATA_UPDATED: "DATA_UPDATED",
    PET_UPDATED: "PET_UPDATED",
};

export type WsEventType = typeof WsEventTypes[keyof typeof WsEventTypes];
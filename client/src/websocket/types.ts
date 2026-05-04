export interface WsEventMsg {
    event_type: WsEventTypes;
    event_data: any;
}

export enum WsEventTypes {
    NEW_DEVICE = "NEW_DEVICE",
    DEVICE_PAIRED = "DEVICE_PAIRED",
    DEVICE_UPDATED = "DEVICE_UPDATED",
    DASHBOARD_UPDATED = "DASHBOARD_UPDATED",
    PET_UPDATED = "PET_UPDATED",
}
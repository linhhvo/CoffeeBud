export interface WsEventMsg {
    event_type: string;
    event_data: T;
}

export enum WsEventTypes {
    NEW_DEVICE = "NEW_DEVICE",
    UPDATE_DEVICE = "UPDATE_DEVICE",
    UPDATE_DASHBOARD = "UPDATE_DASHBOARD",
    UPDATE_PET = "UPDATE_PET",
}
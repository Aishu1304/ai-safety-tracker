import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserSettings {
    safeZoneCenterLat: number;
    safeZoneCenterLng: number;
    alertStartHour: bigint;
    alarmSoundEnabled: boolean;
    safeZoneRadius: bigint;
}
export interface Location {
    latitude: number;
    longitude: number;
    timestamp: bigint;
    locationName: string;
}
export interface Alert {
    latitude: number;
    resolved: boolean;
    description: string;
    longitude: number;
    timestamp: bigint;
}
export interface UserProfile {
    username: string;
    emergencyContact: string;
    email: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAlert(alert: Alert): Promise<void>;
    addLocation(location: Location): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAlerts(): Promise<Array<Alert>>;
    getCallerUserProfile(): Promise<UserProfile>;
    getCallerUserRole(): Promise<UserRole>;
    getLocationHistory(): Promise<Array<Location>>;
    getSettings(): Promise<UserSettings>;
    getUserProfile(user: Principal): Promise<UserProfile>;
    isCallerAdmin(): Promise<boolean>;
    isDeviceOnline(): Promise<boolean>;
    resolveAlert(alertIndex: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveSettings(settings: UserSettings): Promise<void>;
    updateDeviceStatus(): Promise<void>;
}

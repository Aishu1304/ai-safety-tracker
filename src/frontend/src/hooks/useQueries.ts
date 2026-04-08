import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Alert, Location, UserProfile, UserSettings } from "../backend.d";
import { useActor } from "./useActor";

export function useLocationHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<Location[]>({
    queryKey: ["locationHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLocationHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAlerts() {
  const { actor, isFetching } = useActor();
  return useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAlerts();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return { username: "", email: "", emergencyContact: "" };
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<UserSettings>({
    queryKey: ["settings"],
    queryFn: async () => {
      if (!actor)
        return {
          safeZoneCenterLat: 17.385,
          safeZoneCenterLng: 78.4867,
          alertStartHour: BigInt(22),
          alarmSoundEnabled: true,
          safeZoneRadius: BigInt(500),
        };
      return actor.getSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeviceStatus() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["deviceStatus"],
    queryFn: async () => {
      if (!actor) return false;
      await actor.updateDeviceStatus();
      return actor.isDeviceOnline();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useAddLocation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (location: Location) => {
      if (!actor) throw new Error("Not connected");
      return actor.addLocation(location);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locationHistory"] });
    },
  });
}

export function useAddAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alert: Alert) => {
      if (!actor) throw new Error("Not connected");
      return actor.addAlert(alert);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useResolveAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (index: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.resolveAlert(index);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useSaveSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: UserSettings) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

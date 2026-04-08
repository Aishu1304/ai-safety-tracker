import { useCallback, useState } from "react";
import { useGeoLinkerConfig } from "./useGeoLinkerConfig";

export interface GeoLinkerData {
  deviceID: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  locationName?: string;
}

export function useGeoLinker() {
  const { apiKey, deviceId, isConfigured } = useGeoLinkerConfig();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestData, setLatestData] = useState<GeoLinkerData | null>(null);

  const fetchLatestLocation =
    useCallback(async (): Promise<GeoLinkerData | null> => {
      if (!isConfigured) {
        setError("API key and Device ID are required.");
        return null;
      }
      setIsFetching(true);
      setError(null);
      try {
        const url = `https://www.circuitdigest.cloud/api/v1/geolinker/data?deviceID=${encodeURIComponent(deviceId)}`;
        const res = await fetch(url, {
          headers: { Authorization: apiKey },
        });
        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }
        const json = await res.json();
        // GeoLinker may return array or object
        const record: GeoLinkerData = Array.isArray(json)
          ? json[json.length - 1]
          : json;
        setLatestData(record);
        setLastSyncTime(new Date());
        return record;
      } catch (err) {
        const msg =
          err instanceof TypeError
            ? "CORS error — the GeoLinker API blocked this request from the browser. This may require a backend proxy."
            : err instanceof Error
              ? err.message
              : "Unknown error";
        setError(msg);
        return null;
      } finally {
        setIsFetching(false);
      }
    }, [apiKey, deviceId, isConfigured]);

  return {
    fetchLatestLocation,
    isFetching,
    error,
    latestData,
    lastSyncTime,
    isConfigured,
  };
}

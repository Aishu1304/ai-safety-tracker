import { useEffect, useState } from "react";

const KEY_API = "geolinker_api_key";
const KEY_DEVICE = "geolinker_device_id";

export function useGeoLinkerConfig() {
  const [apiKey, setApiKeyState] = useState<string>(
    () => localStorage.getItem(KEY_API) ?? "",
  );
  const [deviceId, setDeviceIdState] = useState<string>(
    () => localStorage.getItem(KEY_DEVICE) ?? "",
  );

  const setApiKey = (val: string) => {
    localStorage.setItem(KEY_API, val);
    setApiKeyState(val);
  };

  const setDeviceId = (val: string) => {
    localStorage.setItem(KEY_DEVICE, val);
    setDeviceIdState(val);
  };

  const isConfigured = apiKey.trim().length > 0 && deviceId.trim().length > 0;

  return { apiKey, deviceId, setApiKey, setDeviceId, isConfigured };
}

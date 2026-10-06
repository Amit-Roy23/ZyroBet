import {
  useKeepAwake as useExpoKeepAwake,
  activateKeepAwakeAsync as expoActivateKeepAwakeAsync,
  deactivateKeepAwake as expoDeactivateKeepAwake,
} from 'expo-keep-awake';

export const useKeepAwake = useExpoKeepAwake;
export const activateKeepAwakeAsync = expoActivateKeepAwakeAsync;
export const deactivateKeepAwake = expoDeactivateKeepAwake;

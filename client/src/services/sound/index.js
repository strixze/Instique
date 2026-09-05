import { useState, useEffect } from 'react';
import { uiSound } from '../../utils/soundManager';

export { uiSound };
export default uiSound;

export function useUISound() {
  const [enabled, setEnabledState] = useState(uiSound.isEnabled());
  const [volume, setVolumeState] = useState(uiSound.getVolume());

  useEffect(() => {
    const unsubscribe = uiSound.subscribe(() => {
      setEnabledState(uiSound.isEnabled());
      setVolumeState(uiSound.getVolume());
    });
    return unsubscribe;
  }, []);

  return {
    enabled,
    volume,
    setEnabled: (val) => uiSound.setEnabled(val),
    setVolume: (val) => uiSound.setVolume(val),
    uiSound,
    tap: uiSound.tap,
    toggle: uiSound.toggle,
    checkbox: uiSound.checkbox,
    select: uiSound.select,
    navigation: uiSound.navigation,
    modal: uiSound.modal,
    success: uiSound.success,
    error: uiSound.error,
  };
}

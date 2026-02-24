import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { useSettingsStore } from '../stores';

const options = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
};

type HapticFeedbackTypes =
    | "impactLight"
    | "impactMedium"
    | "impactHeavy"
    | "rigid"
    | "soft"
    | "notificationSuccess"
    | "notificationWarning"
    | "notificationError"
    | "selection";

/**
 * Triggers a haptic feedback if the user has haptics enabled in settings.
 * Uses high-quality feeling impacts by default.
 * @param type The type of haptic feedback to trigger (default: 'impactLight')
 */
export const triggerHaptic = (type: HapticFeedbackTypes = "impactLight") => {
    // Check if user has disabled haptics in the app settings
    const isEnabled = useSettingsStore.getState().settings.haptic_enabled;

    if (isEnabled) {
        ReactNativeHapticFeedback.trigger(type, options);
    }
};

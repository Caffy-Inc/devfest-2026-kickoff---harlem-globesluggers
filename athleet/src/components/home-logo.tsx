import { Image, type ImageStyle } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, type StyleProp } from 'react-native';

import { wordmarkImage } from '@/components/athleet-wordmark';

type Props = {
    /** Size of the wordmark image, e.g. { width: 108, height: 34 }. */
    style?: StyleProp<ImageStyle>;
    /** Override the default "go home" behaviour (used on the home screen itself). */
    onPress?: () => void;
};

/** The athleet wordmark as a button back to the home (welcome) screen. */
export function HomeLogo({ style, onPress }: Props) {
    const router = useRouter();

    function goHome() {
        if (onPress) return onPress();
        // Pop anything stacked on top of the tabs (plan preview, …), then swap the
        // tabs for the home screen — the same move "Edit my answers" makes.
        if (router.canDismiss()) router.dismissAll();
        router.replace('/');
    }

    return (
        <Pressable
            onPress={goHome}
            accessibilityRole="button"
            accessibilityLabel="Athleet home"
            hitSlop={8}
            style={({ pressed }) => pressed && { opacity: 0.6 }}>
            <Image source={wordmarkImage} style={style} contentFit="contain" />
        </Pressable>
    );
}

import type React from 'react';
import * as RN from 'react-native';

type ComponentWithChildren<P> = React.ComponentType<
  React.PropsWithChildren<P>
>;

// Re-export całe API, a poniżej nadpisujemy tylko te komponenty,
// których typy JSX są niestabilne w obecnym zestawie RN/TS.
export * from 'react-native';

export const View = RN.View as unknown as ComponentWithChildren<RN.ViewProps>;
export const Text = RN.Text as unknown as ComponentWithChildren<RN.TextProps>;
export const ScrollView =
  RN.ScrollView as unknown as ComponentWithChildren<RN.ScrollViewProps>;
export const Pressable =
  RN.Pressable as unknown as ComponentWithChildren<RN.PressableProps>;
export const TouchableOpacity =
  RN.TouchableOpacity as unknown as ComponentWithChildren<RN.TouchableOpacityProps>;
export const ActivityIndicator =
  RN.ActivityIndicator as unknown as ComponentWithChildren<RN.ActivityIndicatorProps>;

export const Animated = {
  ...RN.Animated,
  View: RN.Animated.View as unknown as React.ComponentType<any>,
  Text: RN.Animated.Text as unknown as React.ComponentType<any>,
  ScrollView: RN.Animated.ScrollView as unknown as React.ComponentType<any>,
  Image: RN.Animated.Image as unknown as React.ComponentType<any>,
};

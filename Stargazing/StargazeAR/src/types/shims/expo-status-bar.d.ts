import type { JSX } from 'react';

export type StatusBarStyle = 'auto' | 'inverted' | 'light' | 'dark';

export type StatusBarProps = {
  style?: StatusBarStyle;
  hidden?: boolean;
  translucent?: boolean;
  backgroundColor?: string;
};

export declare function StatusBar(props: StatusBarProps): JSX.Element | null;

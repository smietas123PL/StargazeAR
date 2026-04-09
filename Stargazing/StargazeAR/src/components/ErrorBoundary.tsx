import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from '../utils/reactNative';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[StargazeAR] Uncaught render error', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.icon}>!</Text>
          <Text style={styles.title}>Coś poszło nie tak</Text>
          <Text style={styles.body}>
            Wystąpił nieoczekiwany błąd. Spróbuj wrócić do widoku aplikacji.
          </Text>
          <Pressable style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Spróbuj ponownie</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#050A14',
  },
  icon: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFD966',
    marginBottom: 12,
  },
  title: {
    color: '#F7F9FF',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    color: '#C8D7F3',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#FFD966',
  },
  buttonText: {
    color: '#101010',
    fontSize: 15,
    fontWeight: '700',
  },
});

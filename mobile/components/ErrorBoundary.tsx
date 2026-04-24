import { Component, type ReactNode } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last-resort error boundary. Catches any render-time exception that escapes
 * the React tree and paints a branded "Algo salió mal" screen with a retry
 * button, instead of a white screen. In __DEV__ we also show the stack so
 * you don't lose it to the console.
 *
 * Logs to console.error — a Sentry hook can subscribe to that later.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    const stack =
      typeof __DEV__ !== 'undefined' && __DEV__
        ? `${this.state.error.name}: ${this.state.error.message}\n\n${this.state.error.stack ?? ''}`
        : null;

    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#0A0F14' }}
        edges={['top', 'bottom']}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <Text
            style={{
              fontSize: 48,
              marginBottom: 12,
            }}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            🗺️
          </Text>
          <Text
            style={{
              color: '#F8FAFC',
              fontSize: 22,
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: 8,
            }}
            accessibilityRole="header"
          >
            Algo salió mal
          </Text>
          <Text
            style={{
              color: 'rgba(248,250,252,0.7)',
              fontSize: 14,
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 20,
            }}
          >
            Perdón por el bache. Reintenta y si sigue pasando reinicia la app.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reintentar"
            onPress={this.reset}
            style={{
              backgroundColor: '#06C167',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 999,
              minWidth: 160,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: '#0A0F14',
                fontWeight: '700',
                fontSize: 14,
              }}
            >
              Reintentar
            </Text>
          </Pressable>

          {stack ? (
            <View
              style={{
                marginTop: 32,
                padding: 12,
                backgroundColor: 'rgba(239,68,68,0.1)',
                borderColor: 'rgba(239,68,68,0.3)',
                borderWidth: 1,
                borderRadius: 12,
                width: '100%',
              }}
            >
              <Text
                style={{
                  color: '#FCA5A5',
                  fontSize: 11,
                  fontFamily: 'Menlo',
                }}
              >
                {stack}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }
}

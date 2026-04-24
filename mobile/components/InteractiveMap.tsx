import { View } from 'react-native';
import { type ReactNode } from 'react';

import { StaticMap } from './StaticMap';

export interface MapMarkerInput {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  description?: string;
}

interface Props {
  markers: MapMarkerInput[];
  /** Optional polyline connecting the markers in order. */
  polyline?: boolean;
  style?: object;
}

/**
 * Interactive map wrapper. When the `react-native-maps` module is available
 * (i.e., running in an EAS development build, NOT plain Expo Go), it renders
 * the full pan/zoom map with markers + optional polyline. Otherwise it falls
 * back to `StaticMap` (image) centered on the first marker, so Expo Go users
 * still see something useful.
 */
export function InteractiveMap({
  markers,
  polyline = false,
  style,
}: Props): ReactNode {
  if (markers.length === 0) {
    return (
      <View className="h-48 items-center justify-center rounded-2xl bg-white/5" />
    );
  }

  // react-native-maps is only bundled in dev/preview builds. We dynamically
  // require it and catch the error to stay compatible with Expo Go.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RNMaps = require('react-native-maps');
    const MapView = RNMaps.default;
    const Marker = RNMaps.Marker;
    const Polyline = RNMaps.Polyline;

    const lats = markers.map((m) => m.lat);
    const lngs = markers.map((m) => m.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latDelta = Math.max(0.02, (maxLat - minLat) * 1.4);
    const lngDelta = Math.max(0.02, (maxLng - minLng) * 1.4);

    return (
      <View
        className="overflow-hidden rounded-2xl"
        style={[{ width: '100%', aspectRatio: 16 / 10 }, style]}
      >
        <MapView
          style={{ width: '100%', height: '100%' }}
          initialRegion={{
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: latDelta,
            longitudeDelta: lngDelta,
          }}
        >
          {markers.map((m) => (
            <Marker
              key={m.id}
              coordinate={{ latitude: m.lat, longitude: m.lng }}
              title={m.title}
              description={m.description}
              pinColor="#06C167"
            />
          ))}
          {polyline && markers.length >= 2 ? (
            <Polyline
              coordinates={markers.map((m) => ({
                latitude: m.lat,
                longitude: m.lng,
              }))}
              strokeColor="#06C167"
              strokeWidth={3}
            />
          ) : null}
        </MapView>
      </View>
    );
  } catch {
    // Fallback for Expo Go: static image centered on the first marker.
    const first = markers[0];
    return <StaticMap lat={first.lat} lng={first.lng} style={style} />;
  }
}

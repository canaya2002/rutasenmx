import { View } from 'react-native';
import { Image } from 'expo-image';

import { API_BASE_URL } from '@/lib/constants';
import Constants from 'expo-constants';

interface Props {
  lat: number;
  lng: number;
  width?: number;
  height?: number;
  zoom?: number;
  style?: object;
}

/**
 * Static-image map preview. Prefers Mapbox Static Images API when
 * `EXPO_PUBLIC_MAPBOX_TOKEN` is set, otherwise falls back to the OSM tile
 * via the MapTiler free tier if `EXPO_PUBLIC_MAPTILER_KEY` is set, otherwise
 * draws a neutral placeholder.
 *
 * This is deliberately NOT an interactive map — `react-native-maps` needs
 * native module config + a Google key, which is heavier than Fase 2 needs.
 * Fase 3+ introduces the interactive map on place detail.
 */
export function StaticMap({
  lat,
  lng,
  width = 600,
  height = 400,
  zoom = 13,
  style,
}: Props) {
  const mapboxToken =
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN ??
    (Constants.expoConfig?.extra?.mapboxToken as string | undefined);
  const maptilerKey =
    process.env.EXPO_PUBLIC_MAPTILER_KEY ??
    (Constants.expoConfig?.extra?.maptilerKey as string | undefined);

  let uri: string | null = null;

  if (mapboxToken) {
    const pin = `pin-s+06c167(${lng},${lat})`;
    uri = `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/${pin}/${lng},${lat},${zoom},0/${width}x${height}@2x?access_token=${mapboxToken}`;
  } else if (maptilerKey) {
    uri = `https://api.maptiler.com/maps/outdoor/static/${lng},${lat},${zoom}/${width}x${height}@2x.png?key=${maptilerKey}&markers=${lng},${lat}|stroke:2|color:06C167`;
  }

  // Remove unused-var lint noise; we reference API_BASE_URL only in the stub.
  void API_BASE_URL;

  return (
    <View
      className="overflow-hidden rounded-2xl bg-slate-800"
      style={[{ width: '100%', aspectRatio: 16 / 10 }, style]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          contentFit="cover"
          transition={200}
          style={{ width: '100%', height: '100%' }}
        />
      ) : null}
    </View>
  );
}

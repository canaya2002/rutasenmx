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
  polyline?: boolean;
  style?: object;
}

/**
 * Web-only variant of InteractiveMap. `react-native-maps` is native-only
 * (it uses `react-native/Libraries/Utilities/codegenNativeCommands`, which
 * doesn't exist on web), so Metro picks this file instead when bundling for
 * web. We just render the static map fallback — web users can still see a
 * map image, just not an interactive pan/zoom surface.
 */
export function InteractiveMap({ markers, style }: Props): ReactNode {
  if (markers.length === 0) {
    return (
      <View className="h-48 items-center justify-center rounded-2xl bg-white/5" />
    );
  }
  const first = markers[0];
  return <StaticMap lat={first.lat} lng={first.lng} style={style} />;
}

import { View, Text } from 'react-native';
import { Link, type Href } from 'expo-router';

interface Props {
  title: string;
  subtitle?: string;
  seeAllHref?: Href;
}

/** Consistent section header above every horizontal rail / vertical list. */
export function SectionHeader({ title, subtitle, seeAllHref }: Props) {
  return (
    <View className="mb-3 flex-row items-end justify-between">
      <View className="flex-1 pr-3">
        <Text className="text-xl font-bold text-foreground">{title}</Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs text-foreground/60">{subtitle}</Text>
        ) : null}
      </View>
      {seeAllHref ? (
        <Link href={seeAllHref} className="text-xs font-semibold text-emerald">
          Ver todo →
        </Link>
      ) : null}
    </View>
  );
}

import { View, Text } from 'react-native';

import type { SocialMessageView } from '@shared/index';

interface Props {
  message: SocialMessageView;
  mine: boolean;
}

/**
 * One message in a chat conversation. Tail is on the right for mine, left
 * for the other side. Time is rendered inline at the bottom-right.
 */
export function MessageBubble({ message, mine }: Props) {
  const time = new Date(message.createdAt).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View className={`my-0.5 flex-row ${mine ? 'justify-end' : 'justify-start'}`}>
      <View
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
          mine
            ? 'rounded-br-md bg-emerald'
            : 'rounded-bl-md border border-white/10 bg-white/5'
        }`}
      >
        <Text
          className={`text-sm leading-5 ${
            mine ? 'text-background' : 'text-foreground'
          }`}
        >
          {message.body}
        </Text>
        <Text
          className={`mt-0.5 text-[9px] ${
            mine ? 'text-background/70' : 'text-foreground/50'
          }`}
          style={{ alignSelf: 'flex-end' }}
        >
          {time}
        </Text>
      </View>
    </View>
  );
}

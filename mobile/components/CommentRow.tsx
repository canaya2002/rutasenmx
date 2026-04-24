import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from './Avatar';
import { MotionPressable } from './MotionPressable';
import { useVoteComment } from '@/hooks/useCommunity';
import { haptics } from '@/lib/haptics';
import type { CommentView } from '@/hooks/useCommunity';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'ahora';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

interface Props {
  comment: CommentView;
}

export function CommentRow({ comment }: Props) {
  const vote = useVoteComment(comment.id);

  return (
    <View className="flex-row items-start gap-2 py-3">
      <Avatar uri={comment.authorPhoto} name={comment.authorName} size={32} />
      <View className="flex-1">
        <View className="flex-row items-baseline gap-1.5">
          <Text className="text-xs font-bold text-foreground">
            {comment.authorName}
          </Text>
          <Text className="text-[10px] text-foreground/60">
            {timeAgo(comment.createdAt)}
          </Text>
        </View>
        <Text className="mt-0.5 text-sm leading-5 text-foreground/90">
          {comment.body}
        </Text>
        <MotionPressable
          onPress={() => {
            void haptics.tap();
            vote.mutate();
          }}
          hapticOnPressIn={false}
          className="mt-1 flex-row items-center gap-1 self-start"
        >
          <Ionicons
            name={
              comment.didUpvote
                ? 'arrow-up-circle'
                : 'arrow-up-circle-outline'
            }
            size={14}
            color={comment.didUpvote ? '#06C167' : '#94A3B8'}
          />
          <Text className="text-xs text-foreground/60">
            {comment.upvoteCount + (vote.data?.upvoted === true ? 1 : vote.data?.upvoted === false ? -1 : 0)}
          </Text>
        </MotionPressable>
      </View>
    </View>
  );
}

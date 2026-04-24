import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from './Avatar';
import { MotionPressable } from './MotionPressable';
import { imageUrl } from '@/lib/images';
import type { PostView } from '@/hooks/useCommunity';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `hace ${day} d`;
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
}

interface Props {
  post: PostView;
}

export function PostCard({ post }: Props) {
  const thumb = post.photoUrls[0] ? imageUrl(post.photoUrls[0]) : null;

  return (
    <Link href={`/comunidad/post/${post.id}`} asChild>
      <MotionPressable className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4">
        {/* Author row */}
        <View className="flex-row items-center gap-2">
          <Avatar uri={post.authorPhoto} name={post.authorName} size={28} />
          <View className="flex-1">
            <Text className="text-xs font-semibold text-foreground">
              {post.authorName}
            </Text>
            <Text className="text-[10px] text-foreground/60">
              {timeAgo(post.createdAt)}
            </Text>
          </View>
          {post.isPinned ? (
            <Ionicons name="pin" size={12} color="#06C167" />
          ) : null}
          {post.isLocked ? (
            <Ionicons name="lock-closed" size={12} color="#94A3B8" />
          ) : null}
        </View>

        <Text className="mt-2 text-base font-bold text-foreground" numberOfLines={2}>
          {post.title}
        </Text>
        <Text
          className="mt-1 text-sm leading-5 text-foreground/80"
          numberOfLines={3}
        >
          {post.body}
        </Text>

        {thumb ? (
          <View className="mt-2 flex-row gap-2">
            <View className="relative flex-1 overflow-hidden rounded-xl bg-slate-800">
              <Image
                source={{ uri: thumb }}
                contentFit="cover"
                style={{ aspectRatio: 16 / 9 }}
              />
              {post.photoUrls.length > 1 ? (
                <View className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-white">
                    +{post.photoUrls.length - 1}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        <View className="mt-3 flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <Ionicons
              name={post.didUpvote ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
              size={14}
              color={post.didUpvote ? '#06C167' : '#94A3B8'}
            />
            <Text className="text-xs text-foreground/70">
              {post.upvoteCount}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons
              name="chatbubble-outline"
              size={12}
              color="#94A3B8"
            />
            <Text className="text-xs text-foreground/70">
              {post.commentCount}
            </Text>
          </View>
        </View>
      </MotionPressable>
    </Link>
  );
}

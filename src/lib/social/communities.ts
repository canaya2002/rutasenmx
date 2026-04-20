import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  or,
  sql,
} from 'drizzle-orm';

import { db } from '@/db';
import {
  socialBlocks,
  socialCommunities,
  socialCommunityComments,
  socialCommunityMembers,
  socialCommunityPosts,
  socialCommunityVotes,
  socialContentFlags,
  socialUploads,
} from '@/db/schema';
import { enforceRateLimit } from './rate-limit';
import { sanitizeText, validateText } from './text-safety';

// ── Types exposed to UI ─────────────────────────────────────────────────────
export interface CommunityView {
  id: string;
  type: 'forum' | 'group' | 'channel';
  slug: string;
  name: string;
  description: string | null;
  coverPhotoUrl: string | null;
  memberCount: number;
  postCount: number;
  createdAt: string;
  isMember: boolean;
  role: 'member' | 'moderator' | 'owner' | null;
}

export interface PostView {
  id: string;
  communityId: string;
  communitySlug: string;
  communityName: string;
  authorId: string;
  authorName: string;
  authorPhoto: string | null;
  title: string;
  body: string;
  photoUrls: string[];
  upvoteCount: number;
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  status: 'published' | 'hidden' | 'removed';
  didUpvote: boolean;
}

export interface CommentView {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string | null;
  parentCommentId: string | null;
  body: string;
  upvoteCount: number;
  createdAt: string;
  didUpvote: boolean;
  status: 'published' | 'hidden' | 'removed';
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function makeSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

async function getBlockedIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({
      blocker: socialBlocks.blockerId,
      blocked: socialBlocks.blockedId,
    })
    .from(socialBlocks)
    .where(
      or(eq(socialBlocks.blockerId, userId), eq(socialBlocks.blockedId, userId)),
    );
  const s = new Set<string>();
  for (const r of rows) {
    s.add(r.blocker);
    s.add(r.blocked);
  }
  s.delete(userId); // don't filter ourselves out
  return s;
}

// ── Community list / read ───────────────────────────────────────────────────
export async function listCommunities(
  userId: string,
  opts: { type?: 'forum' | 'group' | 'channel'; q?: string } = {},
): Promise<CommunityView[]> {
  const conditions = [];
  if (opts.type) conditions.push(eq(socialCommunities.type, opts.type));
  if (opts.q) {
    const like = `%${opts.q.toLowerCase()}%`;
    conditions.push(
      sql`LOWER(${socialCommunities.name}) LIKE ${like} OR LOWER(${socialCommunities.description}) LIKE ${like}`,
    );
  }

  const rows = await db
    .select()
    .from(socialCommunities)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(socialCommunities.memberCount), desc(socialCommunities.createdAt))
    .limit(200);

  if (rows.length === 0) return [];

  const memberRows = await db
    .select()
    .from(socialCommunityMembers)
    .where(
      and(
        eq(socialCommunityMembers.userId, userId),
        inArray(
          socialCommunityMembers.communityId,
          rows.map((r) => r.id),
        ),
      ),
    );
  const byCommunity = new Map<string, typeof memberRows[0]>();
  for (const m of memberRows) byCommunity.set(m.communityId, m);

  return rows.map((r) => {
    const m = byCommunity.get(r.id);
    return {
      id: r.id,
      type: r.type,
      slug: r.slug,
      name: r.name,
      description: r.description,
      coverPhotoUrl: r.coverPhotoUrl,
      memberCount: r.memberCount,
      postCount: r.postCount,
      createdAt: r.createdAt.toISOString(),
      isMember: !!m && m.approvedAt != null,
      role: m?.role ?? null,
    };
  });
}

export async function getCommunityBySlug(
  slug: string,
  userId: string,
): Promise<CommunityView | null> {
  const [row] = await db
    .select()
    .from(socialCommunities)
    .where(eq(socialCommunities.slug, slug))
    .limit(1);
  if (!row) return null;

  const [m] = await db
    .select()
    .from(socialCommunityMembers)
    .where(
      and(
        eq(socialCommunityMembers.communityId, row.id),
        eq(socialCommunityMembers.userId, userId),
      ),
    )
    .limit(1);

  return {
    id: row.id,
    type: row.type,
    slug: row.slug,
    name: row.name,
    description: row.description,
    coverPhotoUrl: row.coverPhotoUrl,
    memberCount: row.memberCount,
    postCount: row.postCount,
    createdAt: row.createdAt.toISOString(),
    isMember: !!m && m.approvedAt != null,
    role: m?.role ?? null,
  };
}

export async function createCommunity(
  userId: string,
  input: {
    name: string;
    description?: string;
    type: 'group'; // users can only create groups
    coverPhotoUrl?: string;
    isPublic?: boolean;
    requiresApproval?: boolean;
  },
): Promise<CommunityView> {
  enforceRateLimit('createCommunity', userId);

  const name = sanitizeText(input.name);
  if (name.length < 3 || name.length > 160) {
    throw new Error('El nombre debe tener entre 3 y 160 caracteres');
  }

  let description: string | null = null;
  if (input.description) {
    const c = validateText(input.description, { maxUrls: 2 });
    if (!c.ok) throw new Error(c.violations[0] ?? 'Descripción no permitida');
    description = c.cleaned;
  }

  const base = makeSlug(name);
  let slug = base;
  for (let i = 1; i < 20; i++) {
    const [exists] = await db
      .select()
      .from(socialCommunities)
      .where(eq(socialCommunities.slug, slug))
      .limit(1);
    if (!exists) break;
    slug = `${base}-${i}`;
  }

  const [row] = await db
    .insert(socialCommunities)
    .values({
      type: input.type,
      slug,
      name,
      description,
      coverPhotoUrl: input.coverPhotoUrl ?? null,
      isPublic: input.isPublic ?? true,
      requiresApproval: input.requiresApproval ?? false,
      createdByUserId: userId,
      memberCount: 1,
    })
    .returning();

  await db.insert(socialCommunityMembers).values({
    communityId: row.id,
    userId,
    role: 'owner',
    approvedAt: new Date(),
  });

  return {
    id: row.id,
    type: row.type,
    slug: row.slug,
    name: row.name,
    description: row.description,
    coverPhotoUrl: row.coverPhotoUrl,
    memberCount: row.memberCount,
    postCount: row.postCount,
    createdAt: row.createdAt.toISOString(),
    isMember: true,
    role: 'owner',
  };
}

// ── Membership ──────────────────────────────────────────────────────────────
export async function joinCommunity(
  userId: string,
  slug: string,
): Promise<{ joined: boolean; pending: boolean }> {
  const community = await getCommunityBySlug(slug, userId);
  if (!community) throw new Error('Comunidad no encontrada');

  const [row] = await db
    .select()
    .from(socialCommunities)
    .where(eq(socialCommunities.id, community.id))
    .limit(1);
  if (!row) throw new Error('Comunidad no encontrada');

  const approvedAt = row.requiresApproval ? null : new Date();

  const [existing] = await db
    .select()
    .from(socialCommunityMembers)
    .where(
      and(
        eq(socialCommunityMembers.communityId, row.id),
        eq(socialCommunityMembers.userId, userId),
      ),
    )
    .limit(1);
  if (existing) {
    return { joined: existing.approvedAt != null, pending: existing.approvedAt == null };
  }

  await db.insert(socialCommunityMembers).values({
    communityId: row.id,
    userId,
    role: 'member',
    approvedAt,
  });

  if (approvedAt) {
    await db
      .update(socialCommunities)
      .set({ memberCount: sql`${socialCommunities.memberCount} + 1` })
      .where(eq(socialCommunities.id, row.id));
  }

  return { joined: !!approvedAt, pending: !approvedAt };
}

export async function leaveCommunity(
  userId: string,
  slug: string,
): Promise<void> {
  const [c] = await db
    .select()
    .from(socialCommunities)
    .where(eq(socialCommunities.slug, slug))
    .limit(1);
  if (!c) throw new Error('Comunidad no encontrada');

  const [m] = await db
    .select()
    .from(socialCommunityMembers)
    .where(
      and(
        eq(socialCommunityMembers.communityId, c.id),
        eq(socialCommunityMembers.userId, userId),
      ),
    )
    .limit(1);
  if (!m) return;

  if (m.role === 'owner') {
    throw new Error('El dueño no puede salir; transfiere la comunidad primero');
  }

  await db
    .delete(socialCommunityMembers)
    .where(
      and(
        eq(socialCommunityMembers.communityId, c.id),
        eq(socialCommunityMembers.userId, userId),
      ),
    );

  if (m.approvedAt) {
    await db
      .update(socialCommunities)
      .set({ memberCount: sql`GREATEST(${socialCommunities.memberCount} - 1, 0)` })
      .where(eq(socialCommunities.id, c.id));
  }
}

// ── Posts ───────────────────────────────────────────────────────────────────
async function canPost(
  userId: string,
  communityId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const [c] = await db
    .select()
    .from(socialCommunities)
    .where(eq(socialCommunities.id, communityId))
    .limit(1);
  if (!c) return { allowed: false, reason: 'Comunidad no encontrada' };

  // Channels are broadcast-only — moderators/owners post.
  if (c.type === 'channel') {
    const [m] = await db
      .select()
      .from(socialCommunityMembers)
      .where(
        and(
          eq(socialCommunityMembers.communityId, c.id),
          eq(socialCommunityMembers.userId, userId),
          inArray(socialCommunityMembers.role, ['moderator', 'owner']),
        ),
      )
      .limit(1);
    if (!m) return { allowed: false, reason: 'Solo moderadores publican en este canal' };
    return { allowed: true };
  }

  // Forums: anyone with premium can post (membership is implicit public).
  if (c.type === 'forum') return { allowed: true };

  // Groups: must be an approved member.
  const [m] = await db
    .select()
    .from(socialCommunityMembers)
    .where(
      and(
        eq(socialCommunityMembers.communityId, c.id),
        eq(socialCommunityMembers.userId, userId),
      ),
    )
    .limit(1);
  if (!m || !m.approvedAt)
    return { allowed: false, reason: 'Debes unirte primero' };
  return { allowed: true };
}

export interface CreatePostInput {
  communityId: string;
  title: string;
  body: string;
  photoUrls?: string[];
  photoHashes?: string[];
}

export async function createPost(
  userId: string,
  input: CreatePostInput,
): Promise<string> {
  enforceRateLimit('createPost', userId);

  const gate = await canPost(userId, input.communityId);
  if (!gate.allowed) throw new Error(gate.reason ?? 'No puedes publicar');

  const title = sanitizeText(input.title);
  if (title.length < 3 || title.length > 200) {
    throw new Error('El título debe tener entre 3 y 200 caracteres');
  }

  const bodyCheck = validateText(input.body, { maxUrls: 3 });
  if (!bodyCheck.ok) {
    throw new Error(bodyCheck.violations[0] ?? 'Publicación no permitida');
  }
  if (bodyCheck.cleaned.length < 3 || bodyCheck.cleaned.length > 8000) {
    throw new Error('El contenido debe tener entre 3 y 8000 caracteres');
  }

  const photoUrls = (input.photoUrls ?? []).slice(0, 8);
  const photoHashes = (input.photoHashes ?? []).slice(0, 8);

  // Validate photos actually belong to this user + are clean.
  if (photoUrls.length > 0) {
    const rows = await db
      .select()
      .from(socialUploads)
      .where(
        and(
          eq(socialUploads.userId, userId),
          inArray(socialUploads.url, photoUrls),
        ),
      );
    if (rows.length !== photoUrls.length) {
      throw new Error('Una o más imágenes no se reconocen');
    }
    if (rows.some((r) => r.moderationStatus !== 'published')) {
      throw new Error('Una imagen no pasó moderación');
    }
  }

  const [row] = await db
    .insert(socialCommunityPosts)
    .values({
      communityId: input.communityId,
      authorId: userId,
      title,
      body: bodyCheck.cleaned,
      photoUrls,
      photoHashes,
    })
    .returning({ id: socialCommunityPosts.id });

  await db
    .update(socialCommunities)
    .set({ postCount: sql`${socialCommunities.postCount} + 1` })
    .where(eq(socialCommunities.id, input.communityId));

  return row.id;
}

export async function listPosts(
  communityId: string,
  viewerId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<PostView[]> {
  const blocked = await getBlockedIds(viewerId);
  const blockedList = Array.from(blocked);

  const rows = await db.execute(sql`
    SELECT
      p.id, p.community_id AS "communityId",
      c.slug AS "communitySlug", c.name AS "communityName",
      p.author_id AS "authorId",
      COALESCE(sp.display_name, u.name, 'Usuario') AS "authorName",
      sp.photo_url AS "authorPhoto",
      p.title, p.body, p.photo_urls AS "photoUrls",
      p.upvote_count AS "upvoteCount",
      p.comment_count AS "commentCount",
      p.is_pinned AS "isPinned",
      p.is_locked AS "isLocked",
      p.status,
      p.created_at AS "createdAt",
      EXISTS (
        SELECT 1 FROM social_community_votes v
        WHERE v.post_id = p.id AND v.user_id = ${viewerId} AND v.value = 1
      ) AS "didUpvote"
    FROM social_community_posts p
    JOIN social_communities c ON c.id = p.community_id
    JOIN users u ON u.id = p.author_id
    LEFT JOIN social_profiles sp ON sp.user_id = p.author_id
    WHERE p.community_id = ${communityId}
      AND p.status = 'published'
      ${blockedList.length > 0 ? sql`AND p.author_id <> ALL(${blockedList}::uuid[])` : sql``}
    ORDER BY p.is_pinned DESC, p.created_at DESC
    LIMIT ${opts.limit ?? 30}
    OFFSET ${opts.offset ?? 0}
  `);

  return (rows as unknown as PostView[]).map((p) => ({
    ...p,
    photoUrls: Array.isArray(p.photoUrls) ? p.photoUrls : [],
    createdAt: new Date(p.createdAt).toISOString(),
  }));
}

export async function getPost(postId: string, viewerId: string): Promise<PostView | null> {
  const rows = await db.execute(sql`
    SELECT
      p.id, p.community_id AS "communityId",
      c.slug AS "communitySlug", c.name AS "communityName",
      p.author_id AS "authorId",
      COALESCE(sp.display_name, u.name, 'Usuario') AS "authorName",
      sp.photo_url AS "authorPhoto",
      p.title, p.body, p.photo_urls AS "photoUrls",
      p.upvote_count AS "upvoteCount",
      p.comment_count AS "commentCount",
      p.is_pinned AS "isPinned",
      p.is_locked AS "isLocked",
      p.status,
      p.created_at AS "createdAt",
      EXISTS (
        SELECT 1 FROM social_community_votes v
        WHERE v.post_id = p.id AND v.user_id = ${viewerId} AND v.value = 1
      ) AS "didUpvote"
    FROM social_community_posts p
    JOIN social_communities c ON c.id = p.community_id
    JOIN users u ON u.id = p.author_id
    LEFT JOIN social_profiles sp ON sp.user_id = p.author_id
    WHERE p.id = ${postId}
    LIMIT 1
  `);
  const row = (rows as unknown as PostView[])[0];
  if (!row) return null;
  return {
    ...row,
    photoUrls: Array.isArray(row.photoUrls) ? row.photoUrls : [],
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

// ── Comments ────────────────────────────────────────────────────────────────
export async function createComment(
  userId: string,
  input: { postId: string; body: string; parentCommentId?: string | null },
): Promise<string> {
  enforceRateLimit('createComment', userId);

  const [post] = await db
    .select()
    .from(socialCommunityPosts)
    .where(eq(socialCommunityPosts.id, input.postId))
    .limit(1);
  if (!post || post.status !== 'published') {
    throw new Error('Publicación no disponible');
  }
  if (post.isLocked) throw new Error('Esta conversación está cerrada');

  const check = validateText(input.body, { maxUrls: 2 });
  if (!check.ok) throw new Error(check.violations[0] ?? 'Comentario no permitido');
  if (check.cleaned.length < 1 || check.cleaned.length > 4000) {
    throw new Error('Comentario fuera de rango');
  }

  const [row] = await db
    .insert(socialCommunityComments)
    .values({
      postId: input.postId,
      authorId: userId,
      body: check.cleaned,
      parentCommentId: input.parentCommentId ?? null,
    })
    .returning({ id: socialCommunityComments.id });

  await db
    .update(socialCommunityPosts)
    .set({ commentCount: sql`${socialCommunityPosts.commentCount} + 1` })
    .where(eq(socialCommunityPosts.id, input.postId));

  return row.id;
}

export async function listComments(
  postId: string,
  viewerId: string,
): Promise<CommentView[]> {
  const blocked = await getBlockedIds(viewerId);
  const blockedList = Array.from(blocked);

  const rows = await db.execute(sql`
    SELECT
      c.id, c.post_id AS "postId", c.author_id AS "authorId",
      COALESCE(sp.display_name, u.name, 'Usuario') AS "authorName",
      sp.photo_url AS "authorPhoto",
      c.parent_comment_id AS "parentCommentId",
      c.body, c.upvote_count AS "upvoteCount", c.status,
      c.created_at AS "createdAt",
      EXISTS (
        SELECT 1 FROM social_community_votes v
        WHERE v.comment_id = c.id AND v.user_id = ${viewerId} AND v.value = 1
      ) AS "didUpvote"
    FROM social_community_comments c
    JOIN users u ON u.id = c.author_id
    LEFT JOIN social_profiles sp ON sp.user_id = c.author_id
    WHERE c.post_id = ${postId}
      AND c.status = 'published'
      ${blockedList.length > 0 ? sql`AND c.author_id <> ALL(${blockedList}::uuid[])` : sql``}
    ORDER BY c.created_at ASC
    LIMIT 500
  `);

  return (rows as unknown as CommentView[]).map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt).toISOString(),
  }));
}

// ── Votes ───────────────────────────────────────────────────────────────────
export async function upvotePost(
  userId: string,
  postId: string,
): Promise<{ upvoted: boolean }> {
  enforceRateLimit('vote', userId);

  const [existing] = await db
    .select()
    .from(socialCommunityVotes)
    .where(
      and(
        eq(socialCommunityVotes.userId, userId),
        eq(socialCommunityVotes.postId, postId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .delete(socialCommunityVotes)
      .where(eq(socialCommunityVotes.id, existing.id));
    await db
      .update(socialCommunityPosts)
      .set({ upvoteCount: sql`GREATEST(${socialCommunityPosts.upvoteCount} - 1, 0)` })
      .where(eq(socialCommunityPosts.id, postId));
    return { upvoted: false };
  }

  await db.insert(socialCommunityVotes).values({
    userId,
    postId,
    value: 1,
  });
  await db
    .update(socialCommunityPosts)
    .set({ upvoteCount: sql`${socialCommunityPosts.upvoteCount} + 1` })
    .where(eq(socialCommunityPosts.id, postId));
  return { upvoted: true };
}

export async function upvoteComment(
  userId: string,
  commentId: string,
): Promise<{ upvoted: boolean }> {
  enforceRateLimit('vote', userId);

  const [existing] = await db
    .select()
    .from(socialCommunityVotes)
    .where(
      and(
        eq(socialCommunityVotes.userId, userId),
        eq(socialCommunityVotes.commentId, commentId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .delete(socialCommunityVotes)
      .where(eq(socialCommunityVotes.id, existing.id));
    await db
      .update(socialCommunityComments)
      .set({
        upvoteCount: sql`GREATEST(${socialCommunityComments.upvoteCount} - 1, 0)`,
      })
      .where(eq(socialCommunityComments.id, commentId));
    return { upvoted: false };
  }

  await db.insert(socialCommunityVotes).values({
    userId,
    commentId,
    value: 1,
  });
  await db
    .update(socialCommunityComments)
    .set({ upvoteCount: sql`${socialCommunityComments.upvoteCount} + 1` })
    .where(eq(socialCommunityComments.id, commentId));
  return { upvoted: true };
}

// ── Flags ───────────────────────────────────────────────────────────────────
export async function flagContent(
  userId: string,
  input: {
    postId?: string;
    commentId?: string;
    reason: string;
    note?: string;
  },
): Promise<void> {
  if (!input.postId === !input.commentId) {
    throw new Error('Indica postId o commentId, no ambos');
  }

  await db.insert(socialContentFlags).values({
    reporterId: userId,
    postId: input.postId ?? null,
    commentId: input.commentId ?? null,
    reason: input.reason.slice(0, 80),
    note: input.note ? sanitizeText(input.note).slice(0, 1000) : null,
  });

  // Auto-hide when an item reaches 3 flags.
  if (input.postId) {
    await db
      .update(socialCommunityPosts)
      .set({
        flagCount: sql`${socialCommunityPosts.flagCount} + 1`,
        status: sql`CASE WHEN ${socialCommunityPosts.flagCount} + 1 >= 3 THEN 'hidden'::social_content_status ELSE status END`,
      })
      .where(eq(socialCommunityPosts.id, input.postId));
  }
  if (input.commentId) {
    await db
      .update(socialCommunityComments)
      .set({
        flagCount: sql`${socialCommunityComments.flagCount} + 1`,
        status: sql`CASE WHEN ${socialCommunityComments.flagCount} + 1 >= 3 THEN 'hidden'::social_content_status ELSE status END`,
      })
      .where(eq(socialCommunityComments.id, input.commentId));
  }
}

// ── Record an upload for future auditing / block-on-report ──────────────────
export async function recordUpload(input: {
  userId: string;
  url: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  sha256: string;
  scope: 'avatar' | 'post' | 'cover';
}): Promise<void> {
  await db.insert(socialUploads).values({
    userId: input.userId,
    url: input.url,
    mime: input.mime,
    width: input.width,
    height: input.height,
    size: input.size,
    sha256: input.sha256,
    scope: input.scope,
  });
}

// Re-export for code that used to import from here.
export { isNull };

/** Minimal LINE Messaging API v3 client for Cloudflare Workers. */

const LINE_API = 'https://api.line.me/v2/bot';

// ── buildMentionMessage ───────────────────────────────────────────────────────

export interface MentionInput {
  name: string;
  userId: string;
}

interface Mentionee {
  type: 'user';
  index: number;   // zero-based char index of '@' in text
  length: number;  // length of '@name'
  userId: string;
}

export interface LineTextMessage {
  type: 'text';
  text: string;
  mention?: {
    mentionees: Mentionee[];
  };
}

/**
 * Builds a LINE Messaging API text message with user @mentions.
 *
 * - Supports multiple mentions and duplicate names (matched in text order).
 * - Throws if a listed name is not found in the text.
 *
 * @example
 * buildMentionMessage({
 *   text: '👉 @Jake Kuo 輪到你行動！',
 *   mentions: [{ name: 'Jake Kuo', userId: 'U123abc' }],
 * });
 * // {
 * //   type: 'text',
 * //   text: '👉 @Jake Kuo 輪到你行動！',
 * //   mention: { mentionees: [{ type:'user', index:3, length:9, userId:'U123abc' }] }
 * // }
 */
export function buildMentionMessage({
  text,
  mentions,
}: {
  text: string;
  mentions: MentionInput[];
}): LineTextMessage {
  if (mentions.length === 0) return { type: 'text', text };

  // Group by name to handle duplicates: each entry corresponds to an occurrence in text order
  const byName = new Map<string, MentionInput[]>();
  for (const m of mentions) {
    const list = byName.get(m.name) ?? [];
    list.push(m);
    byName.set(m.name, list);
  }

  const mentionees: Mentionee[] = [];

  for (const [name, entries] of byName) {
    const pattern = `@${name}`;
    let searchFrom = 0;

    for (const entry of entries) {
      const idx = text.indexOf(pattern, searchFrom);
      if (idx === -1) {
        throw new Error(
          `buildMentionMessage: "@${name}" not found in text` +
          (searchFrom > 0 ? ` after position ${searchFrom}` : '')
        );
      }
      mentionees.push({
        type: 'user',
        index: idx,
        length: pattern.length,
        userId: entry.userId,
      });
      searchFrom = idx + pattern.length;
    }
  }

  // LINE requires mentionees sorted by index ascending
  mentionees.sort((a, b) => a.index - b.index);

  return { type: 'text', text, mention: { mentionees } };
}

export async function replyMessage(
  token: string,
  replyToken: string,
  text: string
): Promise<void> {
  const res = await fetch(`${LINE_API}/message/reply`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text }],
    }),
  });
  if (!res.ok) {
    console.error('replyMessage failed:', res.status, await res.text());
  }
}

/**
 * Reply with a real @mention using LINE Text Message v2 (released 2024-10-30).
 *
 * textV2 uses {placeholder} substitution — no index/length calculation needed.
 * The caller passes the plain display text (may include "@name" for readability);
 * replyWithMention will replace the first occurrence of "@{mentionName}" with a
 * {m0} placeholder, or prepend "{m0} " if @name is absent.
 */
export async function replyWithMention(
  token: string,
  replyToken: string,
  text: string,
  mentionUserId: string,
  mentionName: string
): Promise<void> {
  // Replace "@name" in text with {m0} placeholder for textV2 substitution.
  // If not found, prepend the mention so it always appears.
  const pattern = `@${mentionName}`;
  const bodyText = text.includes(pattern)
    ? text.replace(pattern, '{m0}')
    : `{m0} ${text}`;

  const message = {
    type: 'textV2',
    text: bodyText,
    substitution: {
      m0: {
        type: 'mention',
        mentionee: { type: 'user', userId: mentionUserId },
      },
    },
  };

  const res = await fetch(`${LINE_API}/message/reply`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ replyToken, messages: [message] }),
  });
  if (!res.ok) {
    console.error('replyWithMention failed:', res.status, await res.text());
    // Fall back to plain text
    await replyMessage(token, replyToken, text);
  }
}

export async function pushMessage(
  token: string,
  to: string,
  text: string
): Promise<void> {
  try {
    await fetch(`${LINE_API}/message/push`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        messages: [{ type: 'text', text }],
      }),
    });
  } catch {
    // Best-effort; user may not have added the bot as friend
  }
}

export async function getGroupMemberProfile(
  token: string,
  groupId: string,
  userId: string
): Promise<string> {
  try {
    const res = await fetch(
      `${LINE_API}/group/${groupId}/member/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.ok) {
      const data = await res.json() as { displayName: string };
      return data.displayName;
    }
  } catch {
    // ignore
  }
  return `玩家${userId.slice(-4)}`;
}

/** Verify X-Line-Signature using HMAC-SHA256. */
export async function verifySignature(
  channelSecret: string,
  body: string,
  signature: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(channelSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return expected === signature;
}

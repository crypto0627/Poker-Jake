/** Minimal LINE Messaging API v3 client for Cloudflare Workers. */

const LINE_API = 'https://api.line.me/v2/bot';

export interface LineTextMessage {
  type: 'text';
  text: string;
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
 * Reply with a mention (@name) appended.
 * LINE mention format: include mentionees[] with character index in text.
 */
export async function replyWithMention(
  token: string,
  replyToken: string,
  text: string,
  mentionUserId: string,
  mentionName: string
): Promise<void> {
  // Append "@name" at the end of the text — mentionees index points to the @ char
  const mentionStr = `@${mentionName}`;
  // Find the last occurrence in the text (we add it at the end)
  const fullText = text;
  const atIndex = [...fullText].reduce((acc, _, i) => {
    // Find last index of the mentionStr in fullText
    if (fullText.slice(i, i + mentionStr.length) === mentionStr) return i;
    return acc;
  }, -1);

  const body: Record<string, unknown> = {
    replyToken,
    messages: [
      {
        type: 'text',
        text: fullText,
        ...(atIndex >= 0
          ? {
              mentionees: [
                {
                  index: atIndex,
                  length: mentionStr.length,
                  userId: mentionUserId,
                },
              ],
            }
          : {}),
      },
    ],
  };

  const res = await fetch(`${LINE_API}/message/reply`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error('replyWithMention failed:', res.status, await res.text());
    // Fallback: plain text reply
    await replyMessage(token, replyToken, fullText);
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

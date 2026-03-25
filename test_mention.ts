import { buildMentionMessage } from './src/line.js';

let pass = 0, fail = 0;
function check(cond: boolean, label: string, detail = '') {
  if (cond) { console.log('  ✅', label); pass++; }
  else       { console.log('  ❌', label, detail ? `— ${detail}` : ''); fail++; }
}
function checkThrows(fn: () => void, label: string) {
  try { fn(); console.log('  ❌', label, '— expected error but none thrown'); fail++; }
  catch (e) { console.log('  ✅', label, `(${(e as Error).message})`); pass++; }
}

// ── 1. Single mention ─────────────────────────────────────────────────────────
console.log('\n── 1. Single mention');
{
  const msg = buildMentionMessage({
    text: '👉 @Jake Kuo 輪到你行動！',
    mentions: [{ name: 'Jake Kuo', userId: 'U123' }],
  });
  const m = msg.mention!.mentionees[0];
  check(msg.type === 'text', 'type = text');
  check(m.type === 'user', 'mentionee type = user');
  check(m.index === 3, `index = 3`, `got ${m.index}`);   // '👉 ' = 3 chars
  check(m.length === 9, `length = 9 (@Jake Kuo)`, `got ${m.length}`);
  check(m.userId === 'U123', 'userId correct');
}

// ── 2. Multiple different mentions ───────────────────────────────────────────
console.log('\n── 2. Multiple mentions');
{
  const msg = buildMentionMessage({
    text: '@Alice 和 @Bob 都行動了',
    mentions: [
      { name: 'Alice', userId: 'UA' },
      { name: 'Bob',   userId: 'UB' },
    ],
  });
  const ms = msg.mention!.mentionees;
  check(ms.length === 2, '2 mentionees');
  check(ms[0].userId === 'UA', 'first = Alice');
  check(ms[0].index === 0, 'Alice at index 0', `got ${ms[0].index}`);
  check(ms[1].userId === 'UB', 'second = Bob');
  check(ms[1].index > ms[0].index, 'sorted by index ascending');
}

// ── 3. Duplicate names ───────────────────────────────────────────────────────
console.log('\n── 3. Duplicate names (same player mentioned twice)');
{
  const msg = buildMentionMessage({
    text: '@Jake 請 @Jake 行動',
    mentions: [
      { name: 'Jake', userId: 'U1' },
      { name: 'Jake', userId: 'U1' },
    ],
  });
  const ms = msg.mention!.mentionees;
  check(ms.length === 2, '2 mentionees for duplicate name');
  check(ms[0].index === 0, 'first @Jake at index 0', `got ${ms[0].index}`);
  check(ms[1].index > ms[0].index, 'second @Jake appears later');
}

// ── 4. No mentions → no mention field ────────────────────────────────────────
console.log('\n── 4. No mentions');
{
  const msg = buildMentionMessage({ text: 'hello', mentions: [] });
  check(!msg.mention, 'no mention field when mentions empty');
}

// ── 5. Name not in text → throws ─────────────────────────────────────────────
console.log('\n── 5. Error: name not in text');
checkThrows(
  () => buildMentionMessage({
    text: '輪到你了',
    mentions: [{ name: 'Jake', userId: 'U1' }],
  }),
  'throws when @Jake not in text'
);

// ── 6. More occurrences in mentions than in text → throws ────────────────────
console.log('\n── 6. Error: more entries than occurrences');
checkThrows(
  () => buildMentionMessage({
    text: '只有一個 @Jake 在這',
    mentions: [
      { name: 'Jake', userId: 'U1' },
      { name: 'Jake', userId: 'U1' }, // second occurrence not in text
    ],
  }),
  'throws on second occurrence not found'
);

// ── 7. Poker game use case ────────────────────────────────────────────────────
console.log('\n── 7. Poker use case: next player to act');
{
  const msg = buildMentionMessage({
    text: '🃏 第 3 局開始！\n👉 @曾子軒-Jackson 輪到你行動！\n可用指令：/call /raise /fold',
    mentions: [{ name: '曾子軒-Jackson', userId: 'Uabc123' }],
  });
  const m = msg.mention!.mentionees[0];
  const expectedIdx = msg.text.indexOf('@曾子軒-Jackson');
  check(m.index === expectedIdx, `index matches text.indexOf()`, `got ${m.index}, expected ${expectedIdx}`);
  check(m.length === '@曾子軒-Jackson'.length, `length = ${m.length}`);
}

console.log(`\n${'─'.repeat(50)}`);
console.log(`${pass} passed, ${fail} failed`);

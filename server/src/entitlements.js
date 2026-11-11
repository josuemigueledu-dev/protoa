// What each plan allows. One file, so the owner can read the limits and change them in one place.
// Numbers are the proposal in docs/research/ai-costs.md section 5 and market.md section 7 (revised
// Oct 25: free is a taste of the AI tutor, Plus the daily habit); the owner signs them off before
// MONETIZATION is turned on. The course itself is never gated: only AI calls have allowances.

// Every AI task belongs to one allowance group; a task missing here is refused by the quota check.
export const TASK_GROUP = {
  checkFree: 'explain',
  explainMistake: 'explain',
  correctSentence: 'tools',
  talkHelp: 'tools',
  talkTurn: 'talk',
  gradeExam: 'exam',
  generateLesson: 'lesson',
};

// limit per period; period is 'day' | 'week' | 'month' (UTC). limit 0 means "not on this plan".
export const PLANS = {
  free: {
    explain: { limit: 15, period: 'day' },
    tools: { limit: 5, period: 'day' },
    talk: { limit: 10, period: 'week' },
    exam: { limit: 2, period: 'day' },
    lesson: { limit: 0, period: 'month' },
  },
  plus: {
    explain: { limit: 100, period: 'day' },
    tools: { limit: 50, period: 'day' },
    talk: { limit: 240, period: 'month' },
    exam: { limit: 2, period: 'day' },
    lesson: { limit: 4, period: 'month' },
  },
};

export const DEFAULT_PLAN = 'free';

// Off unless the owner sets MONETIZATION=on, so nothing changes for learners until then.
export const monetizationOn = (env = process.env) => String(env.MONETIZATION || '').toLowerCase() === 'on';

export function allowanceFor(plan, task) {
  const group = Object.hasOwn(TASK_GROUP, task) ? TASK_GROUP[task] : undefined;
  if (!group) return null;
  const a = (Object.hasOwn(PLANS, plan) ? PLANS[plan] : PLANS[DEFAULT_PLAN])[group];
  return { group, ...a };
}

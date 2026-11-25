const assert = require('node:assert/strict');
const { test } = require('node:test');
const { storageKey, makeGoal, makeTask, exampleSnapshot, snapshotOf, parseSnapshot, openSnapshot,
  createStore, StorageChangedError } = require('../task-store.js');

const oldSnapshot = {
  version: 1,
  locale: 'ja',
  quadrantOpen: { unclassified: true },
  goals: [{ id: 'goal-1', title: '旧目标', priority: 'P1', deadline: '2026-12-20', note: '旧笔记', steps: [
    { id: 'task-2', title: '子待办', goalId: 'goal-1', done: false, planDate: '2026-11-25' },
    { id: 'task-3', title: '只在目标里的待办', goalId: 'goal-1', done: false }
  ] }],
  standaloneTasks: [{ id: 'task-4', title: '独立待办', goalId: null, done: true, importance: 'yes' }],
  todayTaskIds: ['task-2', 'task-4']
};

function memory(initial = oldSnapshot) {
  const data = new Map([[storageKey, JSON.stringify(initial)]]);
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  let queue = Promise.resolve();
  const locks = {
    request(key, operation) {
      assert.equal(key, storageKey);
      const result = queue.then(operation);
      queue = result.catch(() => {});
      return result;
    }
  };
  return { data, openTab: () => createStore(() => storage, locks) };
}

test('reads the original localStorage format and keeps one object for a linked task', () => {
  const snapshot = memory().openTab().read();
  assert.deepEqual(snapshot, oldSnapshot);
  const state = openSnapshot(snapshot);
  assert.equal(state.goals[0].steps[0], state.checklistTasks[0]);
  state.checklistTasks[0].done = true;
  assert.equal(state.goals[0].steps[0].done, true);
  assert.equal(snapshot.goals[0].steps[0].done, false);
  assert.deepEqual(parseSnapshot(JSON.stringify(snapshotOf(state))), snapshotOf(state));
});

test('saves, reloads, and imports goals with optional deadlines', async () => {
  const { openTab } = memory();
  const tab = openTab();
  const before = tab.read();
  const state = openSnapshot(before);
  state.goals.push(makeGoal('无期限目标', 'P2'));
  await tab.commit(before, snapshotOf(state));

  const saved = openTab().read();
  assert.deepEqual(saved.goals.map(goal => goal.deadline), ['2026-12-20', '']);
  state.goals[0].deadline = '';
  await tab.commit(saved, snapshotOf(state));

  const backup = openTab().read();
  assert.deepEqual(backup.goals.map(goal => goal.deadline), ['', '']);
  delete backup.goals[1].deadline;
  await tab.replace(parseSnapshot(JSON.stringify(backup)));
  assert.deepEqual(openTab().read().goals.map(goal => goal.deadline), ['', '']);

  backup.goals[0].deadline = 'invalid';
  assert.throws(() => parseSnapshot(JSON.stringify(backup)), /Invalid goal/);
});

test('two stale tabs can add tasks without overwriting each other', async () => {
  const { openTab } = memory();
  const tabA = openTab();
  const tabB = openTab();
  const first = tabA.read();
  const second = tabB.read();
  const stateA = openSnapshot(first);
  const stateB = openSnapshot(second);
  stateA.checklistTasks.push(makeTask('Tab A'));
  stateB.checklistTasks.push(makeTask('Tab B'));
  await Promise.all([tabA.commit(first, snapshotOf(stateA)), tabB.commit(second, snapshotOf(stateB))]);
  const afterReload = openSnapshot(openTab().read());
  assert.deepEqual(afterReload.checklistTasks.slice(-2).map(task => task.title), ['Tab A', 'Tab B']);
  assert.notEqual(afterReload.checklistTasks.at(-2).id, afterReload.checklistTasks.at(-1).id);
});

test('merges independent edits and retains a deletion against an unrelated edit', async () => {
  const { openTab } = memory();
  const tabA = openTab();
  const tabB = openTab();
  const first = tabA.read();
  const second = tabB.read();
  const stateA = openSnapshot(first);
  const stateB = openSnapshot(second);
  stateA.goals[0].note = '笔记已更新';
  stateA.checklistTasks[0].done = true;
  stateA.checklistTasks.pop();
  stateB.goals[0].title = '新标题';
  stateB.checklistTasks[0].importance = 'yes';
  stateB.checklistTasks[1].urgency = 'yes';
  await tabA.commit(first, snapshotOf(stateA));
  await tabB.commit(second, snapshotOf(stateB));
  const after = openSnapshot(openTab().read());
  assert.equal(after.goals[0].title, '新标题');
  assert.equal(after.goals[0].note, '笔记已更新');
  assert.equal(after.checklistTasks[0], after.goals[0].steps[0]);
  assert.equal(after.checklistTasks[0].done, true);
  assert.equal(after.checklistTasks[0].importance, 'yes');
  assert.equal(after.checklistTasks.length, 1);
});

test('deleting a goal keeps subtasks another tab just added to the board', async () => {
  const { openTab } = memory();
  const tab = openTab();
  const before = tab.read();
  const linking = openSnapshot(before);
  const deleting = openSnapshot(before);
  linking.checklistTasks.push(linking.goals[0].steps[1]);
  deleting.goals.length = 0;
  deleting.checklistTasks[0].goalId = null;
  await tab.commit(before, snapshotOf(linking));
  await tab.commit(before, snapshotOf(deleting));
  const after = openSnapshot(tab.read());
  assert.equal(after.goals.length, 0);
  assert.deepEqual(after.checklistTasks.map(task => [task.id, task.goalId]),
    [['task-2', null], ['task-4', null], ['task-3', null]]);
});

test('a valid import can replace data while old tabs cannot write into the imported version', async () => {
  const { openTab } = memory();
  const importing = openTab();
  const stale = openTab();
  const before = stale.read();
  const edited = openSnapshot(before);
  edited.goals[0].title = '上次打开的页面';
  const backup = JSON.stringify(oldSnapshot, null, 2);
  const restored = await importing.replace(parseSnapshot(backup));
  assert.deepEqual(importing.read(), restored);
  await assert.rejects(stale.commit(before, snapshotOf(edited)), StorageChangedError);
  assert.deepEqual(importing.read(), restored);
  assert.throws(() => parseSnapshot('{not-json}'), SyntaxError);
  assert.throws(() => parseSnapshot(JSON.stringify({ ...oldSnapshot, todayTaskIds: ['task-999'] })), /references/);
});

test('blocked or damaged storage is kept intact, while an explicit import can restore it', async () => {
  const { openTab, data } = memory();
  const tab = openTab();
  const before = tab.read();
  data.set(storageKey, 'broken');
  await assert.rejects(tab.commit(before, before), SyntaxError);
  assert.equal(data.get(storageKey), 'broken');
  await tab.replace(before);
  assert.equal(tab.read().goals[0].id, 'goal-1');
});

test('two first-load saves keep one initial dataset and the first edited task', async () => {
  const { openTab, data } = memory();
  data.delete(storageKey);
  const first = exampleSnapshot(new Date(2026, 10, 25));
  const second = exampleSnapshot(new Date(2026, 10, 26));
  const editing = openSnapshot(first);
  editing.checklistTasks.push(makeTask('Saved first'));
  await openTab().commit(first, snapshotOf(editing), true);
  await openTab().commit(second, second, true);
  const saved = openTab().read();
  assert.equal(saved.goals[0].deadline, first.goals[0].deadline);
  assert.equal(saved.standaloneTasks.at(-1).title, 'Saved first');
});

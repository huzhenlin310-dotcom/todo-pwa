(function (root) {
  'use strict';

  const storageKey = 'long-term-goals-and-today:state';
  const priorities = ['P0', 'P1', 'P2'];
  const tagFields = ['importance', 'urgency'];
  const quadrantKeys = ['yes-yes', 'yes-no', 'no-yes', 'no-no', 'unclassified'];
  const locales = ['zh-CN', 'ja', 'en'];

  function localDate(date, offset = 0) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + offset);
    return [copy.getFullYear(), copy.getMonth() + 1, copy.getDate()]
      .map(part => String(part).padStart(2, '0')).join('-');
  }

  function newId(prefix) {
    // Leave the low IDs for examples and retain the numeric suffix used by older builds.
    const [high, low] = root.crypto.getRandomValues(new Uint32Array(2));
    return `${prefix}-${((high & 0x7ffff) + 0x80000) * 2 ** 32 + low}`;
  }

  function makeTask(title, goalId = null) {
    return { id: newId('task'), title, goalId, done: false };
  }

  function makeGoal(title, priority, deadline) {
    return { id: newId('goal'), title, priority, deadline, note: '', steps: [] };
  }

  function exampleSnapshot(now = new Date()) {
    let sequence = 0;
    function task(title, goalId = null) {
      return { id: `task-${++sequence}`, title, goalId, done: false };
    }
    function goal(title, priority, offset, note, steps) {
      const id = `goal-${++sequence}`;
      return { id, title, priority, deadline: localDate(now, offset), note, steps: steps.map(title => task(title, id)) };
    }
    const goals = [
      goal('完成研究论文撰写', 'P0', 18, '先定研究问题和文章结构，再补齐每一节的论据。', ['列出论文的三级提纲', '整理实验结果与图表']),
      goal('完成 AI 程序开发', 'P1', 32, '先跑通输入、处理、输出的最小流程。', ['写出最小功能清单']),
      goal('完成 AI 本地部署', 'P2', 45, '记录本机环境、启动步骤和验证结果。', ['检查本机显卡与可用内存'])
    ];
    return snapshotOf({ goals, checklistTasks: [task('缴网费'), task('买菜')], locale: 'zh-CN', quadrantOpen: {} });
  }

  function snapshotOf({ goals, checklistTasks, locale, quadrantOpen, epoch }) {
    return JSON.parse(JSON.stringify({
      version: 1, epoch, locale, quadrantOpen, goals,
      standaloneTasks: checklistTasks.filter(task => task.goalId === null),
      // Keep the original name, which represents membership in the task board.
      todayTaskIds: checklistTasks.map(task => task.id)
    }));
  }

  function parseSnapshot(raw) {
    const saved = JSON.parse(raw);
    if (saved?.version !== 1 || !Array.isArray(saved.goals) ||
        !Array.isArray(saved.standaloneTasks) || !Array.isArray(saved.todayTaskIds)) {
      throw new Error('Unrecognized task data');
    }

    const ids = new Set();
    const tasks = new Map();
    function registerId(id, type) {
      if (typeof id !== 'string' || !id.startsWith(`${type}-`) || ids.has(id)) return false;
      const suffix = id.slice(type.length + 1);
      const number = Number(suffix);
      if (!Number.isSafeInteger(number) || number < 1 || String(number) !== suffix) return false;
      ids.add(id);
      return true;
    }

    function readTask(task, goalId) {
      if (!task || task.goalId !== goalId || typeof task.title !== 'string' ||
          typeof task.done !== 'boolean' || !registerId(task.id, 'task')) throw new Error('Invalid task');
      const clean = { id: task.id, title: task.title, goalId, done: task.done };
      for (const field of tagFields) {
        if (task[field] === 'yes' || task[field] === 'no') clean[field] = task[field];
      }
      if (task.checklistArchived === true) clean.checklistArchived = true;
      if (typeof task.planDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(task.planDate) &&
          Number.isFinite(Date.parse(task.planDate))) clean.planDate = task.planDate;
      tasks.set(clean.id, clean);
      return clean;
    }

    const goals = saved.goals.map(goal => {
      if (!goal || typeof goal.title !== 'string' || typeof goal.note !== 'string' ||
          !priorities.includes(goal.priority) || typeof goal.deadline !== 'string' ||
          !/^\d{4,}-\d{2}-\d{2}$/.test(goal.deadline) || !registerId(goal.id, 'goal') ||
          !Array.isArray(goal.steps)) throw new Error('Invalid goal');
      const { id, title, priority, deadline, note } = goal;
      const clean = { id, title, priority, deadline, note, steps: goal.steps.map(task => readTask(task, id)) };
      if (goal.archived === true) clean.archived = true;
      return clean;
    });
    const standaloneTasks = saved.standaloneTasks.map(task => readTask(task, null));
    const boardIds = new Set(saved.todayTaskIds);
    if ([...boardIds].some(id => !tasks.has(id)) || standaloneTasks.some(task => !boardIds.has(task.id))) {
      throw new Error('Invalid task references');
    }
    for (const task of tasks.values()) {
      if (!boardIds.has(task.id)) delete task.checklistArchived;
      if (!boardIds.has(task.id) || task.checklistArchived) delete task.planDate;
    }
    const snapshot = { version: 1 };
    if (typeof saved.epoch === 'string' && /^import-\d{1,16}$/.test(saved.epoch)) snapshot.epoch = saved.epoch;
    snapshot.locale = locales.includes(saved.locale) ? saved.locale : 'zh-CN';
    snapshot.quadrantOpen = Object.fromEntries(quadrantKeys
      .filter(key => typeof saved.quadrantOpen?.[key] === 'boolean').map(key => [key, saved.quadrantOpen[key]]));
    return Object.assign(snapshot, { goals, standaloneTasks, todayTaskIds: [...boardIds] });
  }

  function openSnapshot(snapshot) {
    const { epoch, locale, quadrantOpen, goals, standaloneTasks, todayTaskIds } = JSON.parse(JSON.stringify(snapshot));
    const tasks = new Map([...standaloneTasks, ...goals.flatMap(goal => goal.steps)].map(task => [task.id, task]));
    return { epoch, locale, quadrantOpen, goals, checklistTasks: todayTaskIds.map(id => tasks.get(id)) };
  }

  function mergeFields(before, after, latest) {
    const patched = { ...latest };
    for (const [field, value] of Object.entries(after)) {
      if (value !== before[field]) patched[field] = value;
    }
    for (const field of Object.keys(before)) {
      if (!Object.hasOwn(after, field)) delete patched[field];
    }
    return patched;
  }

  function mergeEntries(before, after, latest) {
    const merged = new Map(latest);
    for (const id of before.keys()) {
      if (!after.has(id)) merged.delete(id);
    }
    for (const [id, entry] of after) {
      if (!before.has(id)) {
        if (latest.has(id)) throw new Error('Duplicate record ID');
        merged.set(id, { ...entry });
      } else if (latest.has(id)) {
        merged.set(id, mergeFields(before.get(id), entry, latest.get(id)));
      }
    }
    return merged;
  }

  function mergeBoard(before, after, latest) {
    const known = new Set(before);
    const remaining = new Set(after);
    const order = latest.filter(id => !known.has(id) || remaining.has(id));
    for (let index = after.length - 1; index >= 0; index--) {
      const id = after[index];
      if (known.has(id) || order.includes(id)) continue;
      const next = order.indexOf(after[index + 1]);
      order.splice(next === -1 ? order.length : next, 0, id);
    }
    return order;
  }

  function mergeSnapshots(before, after, latest) {
    const goalFields = snapshot => new Map(snapshot.goals.map(({ steps, ...goal }) => [goal.id, goal]));
    const taskFields = snapshot => new Map([...snapshot.standaloneTasks, ...snapshot.goals.flatMap(goal => goal.steps)]
      .map(task => [task.id, task]));
    const latestTasks = taskFields(latest);
    const goals = mergeEntries(goalFields(before), goalFields(after), goalFields(latest));
    const tasks = mergeEntries(taskFields(before), taskFields(after), latestTasks);
    const board = mergeBoard(before.todayTaskIds, after.todayTaskIds, latest.todayTaskIds);
    const previouslyLinked = new Set(before.todayTaskIds);

    for (const id of board) {
      // A task linked by another tab while its goal was being deleted stays on the board.
      const task = latestTasks.get(id);
      if (!tasks.has(id) && task?.goalId && !goals.has(task.goalId) && !previouslyLinked.has(id)) {
        tasks.set(id, { ...task, goalId: null });
      }
    }
    for (const goal of goals.values()) goal.steps = [];
    const boardIds = new Set(board);
    for (const [id, task] of tasks) {
      const goal = goals.get(task.goalId);
      if (goal) goal.steps.push(task);
      else if (boardIds.has(id)) task.goalId = null;
      else tasks.delete(id);
    }
    const checklistTasks = board.filter(id => tasks.has(id)).map(id => tasks.get(id));
    // Revalidate coupled fields such as planned dates on archived tasks.
    const result = snapshotOf({
      goals: [...goals.values()], checklistTasks, epoch: latest.epoch,
      locale: before.locale === after.locale ? latest.locale : after.locale,
      quadrantOpen: mergeFields(before.quadrantOpen, after.quadrantOpen, latest.quadrantOpen)
    });
    return parseSnapshot(JSON.stringify(result));
  }

  class StorageChangedError extends Error {}

  function createStore(getStorage, locks) {
    const run = operation => locks ? locks.request(storageKey, operation) : operation();
    function read() {
      const raw = getStorage().getItem(storageKey);
      return raw === null ? null : parseSnapshot(raw);
    }
    function write(snapshot) {
      getStorage().setItem(storageKey, JSON.stringify(snapshot));
      return snapshot;
    }
    return {
      read,
      async commit(before, after, initializing = false) {
        return run(() => {
          const latest = read();
          if ((!latest && !initializing) || (latest && latest.epoch !== before.epoch)) throw new StorageChangedError();
          return write(latest ? mergeSnapshots(before, after, latest) : after);
        });
      },
      async replace(snapshot) {
        return run(() => write({ ...snapshot, epoch: newId('import') }));
      }
    };
  }

  const api = { storageKey, priorities, tagFields, localDate, makeTask, makeGoal, exampleSnapshot,
    snapshotOf, parseSnapshot, openSnapshot, createStore, StorageChangedError };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.todoTaskStore = api;
})(globalThis);

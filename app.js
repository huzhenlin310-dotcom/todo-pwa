(() => {
  const { storageKey, priorities, tagFields, localDate, makeTask, makeGoal, exampleSnapshot,
    snapshotOf, parseSnapshot, openSnapshot, createStore, StorageChangedError } = globalThis.todoTaskStore;
  const webPage = /^https?:$/.test(location.protocol);
  const store = createStore(() => localStorage, webPage ? navigator.locks : undefined);
  const goalsRoot = document.querySelector('#goals');
  const checklistRoot = document.querySelector('#checklist-tasks');
  const boardView = document.querySelector('#board-view');
  const todayView = document.querySelector('#today-view');
  const todayRoot = document.querySelector('#today-tasks');
  const todayProgress = document.querySelector('#today-progress');
  const pastView = document.querySelector('#past-view');
  const pastRoot = document.querySelector('#past-tasks');
  const taskViewSwitch = document.querySelector('.task-view-switch');
  const undoNotice = document.querySelector('#undo-notice');
  const undoMessage = document.querySelector('#undo-message');
  const swipeThreshold = 64;
  const addGoalForm = document.querySelector('#add-goal');
  const addGoalToggle = document.querySelector('#toggle-add-goal');
  const addTaskForm = document.querySelector('#add-task');
  const languagePicker = document.querySelector('#language');
  const status = document.querySelector('#status');
  const storageNotice = document.querySelector('#storage-notice');
  const retryStorage = document.querySelector('#retry-storage');
  const homeView = document.querySelector('#home-view');
  const archiveView = document.querySelector('#archive-view');
  const settingsView = document.querySelector('#settings-view');
  const release = JSON.parse(document.querySelector('#app-release').textContent);
  const archiveGoalsRoot = document.querySelector('#archived-goals');
  const archiveTasksRoot = document.querySelector('#archived-tasks');
  const deleteDialog = document.querySelector('#delete-dialog');
  const deleteDescription = document.querySelector('#delete-description');
  const importDialog = document.querySelector('#import-dialog');
  const backupNotice = document.querySelector('#backup-notice');
  const backupFile = document.querySelector('#backup-file');
  const importButton = document.querySelector('#import-backup');
  const tagLabels = {
    importance: { yes: 'important', no: 'notImportant' },
    urgency: { yes: 'urgent', no: 'notUrgent' }
  };
  const quadrants = {
    'yes-yes': 'importantUrgent', 'yes-no': 'importantNotUrgent',
    'no-yes': 'notImportantUrgent', 'no-no': 'notImportantNotUrgent',
    unclassified: 'unclassified'
  };
  const messages = {
    'zh-CN': {
      pageTitle: '长期目标与日常待办', language: '语言',
      goalsHeading: '长期目标', checklistHeading: '日常待办',
      taskViews: '日常待办视图', boardHeading: '四象限待办', todayHeading: '今日待办', pastHeading: '往期待办',
      todayProgress: '已完成 {value} / {total} 项',
      importantUrgent: '重要且紧急', importantNotUrgent: '重要不紧急',
      notImportantUrgent: '不重要但紧急', notImportantNotUrgent: '不重要不紧急', unclassified: '待分类',
      planForToday: '加入今天', plannedToday: '已加入今天', planForTodayItem: '将「{value}」加入今天',
      removeFromToday: '移出今天', removeFromTodayItem: '将「{value}」移出今天', taskUnplanned: '已将「{value}」移出今日待办',
      planDate: '原计划 {value}', taskPlanned: '已将「{value}」加入今日待办',
      emptyToday: '今天还没有安排任务。', pickTodayTasks: '去四象限选任务', undo: '撤销', taskPlanRestored: '已恢复「{value}」的原安排',
      swipeHint: '左滑归档，右滑加入今天。也可点「⋯」。',
      moreTaskActions: '「{value}」的更多操作', closeTags: '收起',
      add: '添加', taskPrompt: '要做什么？',
      goalTitle: '目标名称', deadline: '截止日期（选填）', clearDeadline: '清除日期', priority: '优先级', priorityValue: '优先级 {value}',
      addGoal: '添加目标', saveGoal: '保存目标', editGoal: '编辑目标信息',
      goalNote: '目标笔记', notePrompt: '记录具体情况、思路或做法',
      subtasks: '子待办', stepPrompt: '下一步怎么做？', addStep: '添加子待办',
      addToTasks: '加入待办', removeFromTasks: '移出待办', removeFromArchivedTasks: '移出归档待办', source: '来自 {value}',
      tags: '标签', taskTags: '「{value}」的标签', importance: '重要性', urgency: '紧急程度',
      unset: '未设置', important: '重要', notImportant: '不重要', urgent: '紧急', notUrgent: '不紧急',
      dueToday: '今天截止', daysLeft: '剩 {value} 天', dayLeft: '剩 {value} 天',
      daysOverdue: '已超过 {value} 天', dayOverdue: '已超过 {value} 天',
      requireTitle: '请输入名称', taskAdded: '已添加「{value}」', stepAdded: '已添加子待办「{value}」',
      linkedTaskAdded: '已将「{value}」加入日常待办', linkedTaskRemoved: '已将「{value}」移出日常待办',
      navigation: '页面导航', home: '首页', archiveHeading: '已归档', archive: '归档', restore: '取消归档',
      settingsHeading: '设置', historyHeading: '版本更新历史', currentVersion: '当前版本 {value}',
      releaseHistoryUnavailable: '版本历史随发布版本提供。',
      updatesHeading: '检查更新', checkUpdates: '检查更新', updateSchedule: '应用打开时，每 24 小时自动检查一次。',
      checkingUpdates: '正在检查更新…', upToDate: '已是最新版本（{value}）。',
      updateAvailable: '发现新版本 {value}', updateLater: '稍后', updateNow: '立即更新',
      updateDescription: '更新会重新加载应用，已保存的目标、待办和设置会保留。',
      updateCheckFailed: '暂时无法检查更新，请稍后重试。', updatesUnavailable: '请打开线上或本地预览版本以检查更新。',
      updating: '正在准备新版…', updateFailed: '更新未完成。请稍后重试，或返回设置重新检查更新。',
      updateDraft: '请先保存或清空正在编辑的目标或待办，再更新。', updateSaveFailed: '本地改动尚未保存。请先处理保存问题，再更新。',
      archiveItem: '归档「{value}」', restoreItem: '取消归档「{value}」', deleteItem: '永久删除「{value}」',
      emptyArchiveGoals: '暂无已归档的长期目标。',
      emptyArchiveTasks: '暂无已归档的日常待办。', archived: '已归档「{value}」', restored: '已取消归档「{value}」',
      deleteHeading: '永久删除？', delete: '永久删除', cancel: '取消', deleted: '已永久删除「{value}」',
      deleteGoalPrompt: '将永久删除「{value}」、目标笔记和目标内独有的子待办。已加入日常待办的子待办会作为独立待办保留。',
      deleteTaskPrompt: '将永久删除「{value}」及其标签。',
      deleteLinkedTaskPrompt: '将永久删除「{value}」在日常待办中的条目及标签。原目标里的子待办会保留。',
      storageReadError: '无法读取本地记录，当前显示示例。',
      storageWriteError: '本地保存失败。当前改动仅保留在此页面。', retryStorage: '重试保存', storageSaved: '已保存',
      storageConflict: '本地数据已在另一标签页替换或清除。可以先导出此页的备份，再刷新。',
      dataSettings: '数据备份', localData: '待办保存在此浏览器。换设备或清除站点数据前，请先导出备份。',
      exportBackup: '导出备份', importBackup: '导入备份', importHeading: '导入备份？',
      importDescription: '导入会替换当前浏览器里的目标、待办和应用设置。', replaceData: '替换数据',
      badBackup: '无法读取此备份。请选择本应用导出的 JSON 文件。',
      importFailed: '无法保存导入的数据。', importComplete: '已导入备份。',
      installMessage: '把待办装到设备上，像 App 一样打开。',
      installNow: '一键安装', installHelp: '安装方法', installDismiss: '关闭安装提示', installEntry: '安装应用',
      installGuideIOS: '在 Safari 打开此页，轻点「共享」→「添加到主屏幕」。如果有「作为网页 App 打开」，请开启，再轻点「添加」。',
      installGuideMac: '在 Safari 中点「共享」→「添加到程序坞」，再点「添加」。',
      installGuideAndroid: '在 Chrome 打开此页，点右上角菜单，选择安装应用或添加到主屏幕。',
      installGuideDesktop: '在地址栏或浏览器菜单中查找安装选项。如果没有，可以用 Chrome 或 Edge 打开此页。'
    },
    ja: {
      pageTitle: '長期目標とやること', language: '言語',
      goalsHeading: '長期目標', checklistHeading: 'やること',
      taskViews: 'やることの表示切り替え', boardHeading: '4象限', todayHeading: '今日のタスク', pastHeading: '未完了の過去タスク',
      todayProgress: '{total}件中{value}件完了',
      importantUrgent: '重要かつ緊急', importantNotUrgent: '重要だが緊急ではない',
      notImportantUrgent: '緊急だが重要ではない', notImportantNotUrgent: '重要でも緊急でもない', unclassified: '未分類',
      planForToday: '今日に追加', plannedToday: '今日に追加済み', planForTodayItem: '「{value}」を今日に追加',
      removeFromToday: '今日の予定から外す', removeFromTodayItem: '「{value}」を今日の予定から外す', taskUnplanned: '「{value}」を今日の予定から外しました',
      planDate: '元の予定：{value}', taskPlanned: '「{value}」を今日のタスクに追加しました',
      emptyToday: '今日のタスクはまだありません。', pickTodayTasks: '4象限でタスクを選ぶ', undo: '元に戻す', taskPlanRestored: '「{value}」の予定を元に戻しました',
      swipeHint: '左へスワイプでアーカイブ、右へスワイプで今日に追加できます。「⋯」からも操作できます。',
      moreTaskActions: '「{value}」のその他の操作', closeTags: '閉じる',
      add: '追加', taskPrompt: '何をしますか？',
      goalTitle: '目標名', deadline: '期限（任意）', clearDeadline: '期限をクリア', priority: '優先度', priorityValue: '優先度 {value}',
      addGoal: '目標を追加', saveGoal: '目標を保存', editGoal: '目標を編集',
      goalNote: '目標メモ', notePrompt: '状況や考え、進め方をメモする',
      subtasks: 'サブタスク', stepPrompt: '次に何をしますか？', addStep: 'サブタスクを追加',
      addToTasks: 'リストに追加', removeFromTasks: 'リストから外す', removeFromArchivedTasks: 'アーカイブから外す', source: '目標：{value}',
      tags: 'タグ', taskTags: '「{value}」のタグ', importance: '重要度', urgency: '緊急度',
      unset: '未設定', important: '重要', notImportant: '重要ではない', urgent: '緊急', notUrgent: '緊急ではない',
      dueToday: '今日が期限', daysLeft: '残り{value}日', dayLeft: '残り{value}日',
      daysOverdue: '期限を{value}日超過', dayOverdue: '期限を{value}日超過',
      requireTitle: '名前を入力してください', taskAdded: '「{value}」を追加しました',
      stepAdded: 'サブタスク「{value}」を追加しました', linkedTaskAdded: '「{value}」をやることリストに追加しました',
      linkedTaskRemoved: '「{value}」をやることリストから外しました',
      navigation: 'ページナビゲーション', home: 'ホーム', archiveHeading: 'アーカイブ', archive: 'アーカイブ', restore: '元に戻す',
      settingsHeading: '設定', historyHeading: '更新履歴', currentVersion: '現在のバージョン {value}',
      releaseHistoryUnavailable: '更新履歴はリリース版で確認できます。',
      updatesHeading: '更新の確認', checkUpdates: '更新を確認', updateSchedule: 'アプリを開いている間は、24時間ごとに更新を自動確認します。',
      checkingUpdates: '更新を確認しています…', upToDate: '最新バージョン（{value}）を使用しています。',
      updateAvailable: '新しいバージョン {value} があります', updateLater: '後で', updateNow: '今すぐ更新',
      updateDescription: '更新するとアプリが再読み込みされます。保存済みの目標、タスク、設定は保持されます。',
      updateCheckFailed: '更新を確認できませんでした。後でもう一度お試しください。', updatesUnavailable: '公開版またはローカルプレビューで更新を確認できます。',
      updating: '更新を準備しています…', updateFailed: '更新できませんでした。後で再試行するか、設定から更新を確認してください。',
      updateDraft: '編集中の目標やタスクを保存または消去してから更新してください。', updateSaveFailed: '変更が保存されていません。保存の問題を解消してから更新してください。',
      archiveItem: '「{value}」をアーカイブ', restoreItem: '「{value}」を元に戻す', deleteItem: '「{value}」を完全に削除',
      emptyArchiveGoals: 'アーカイブされた長期目標はありません。',
      emptyArchiveTasks: 'アーカイブされたタスクはありません。', archived: '「{value}」をアーカイブしました', restored: '「{value}」を元に戻しました',
      deleteHeading: '完全に削除しますか？', delete: '完全に削除', cancel: 'キャンセル', deleted: '「{value}」を完全に削除しました',
      deleteGoalPrompt: '「{value}」と目標メモ、目標内だけにあるサブタスクを完全に削除します。やることリストに追加済みのサブタスクは独立したタスクとして残ります。',
      deleteTaskPrompt: '「{value}」とそのタグを完全に削除します。',
      deleteLinkedTaskPrompt: 'やることリストから「{value}」とそのタグを完全に削除します。元の目標にあるサブタスクは残ります。',
      storageReadError: '保存データを読み込めなかったため、サンプルを表示しています。',
      storageWriteError: '保存できませんでした。変更はこのページを開いている間だけ保持されます。',
      retryStorage: '保存を再試行', storageSaved: '保存しました',
      storageConflict: '別のタブでデータが置き換えられたか削除されました。必要に応じてバックアップを出力し、再読み込みしてください。',
      dataSettings: 'バックアップ', localData: 'タスクはこのブラウザーに保存されます。端末を変更したりサイトのデータを消去したりする前にバックアップを出力してください。',
      exportBackup: 'バックアップを出力', importBackup: 'バックアップを読み込む', importHeading: 'バックアップを読み込みますか？',
      importDescription: 'このブラウザーの目標、タスク、アプリの設定が置き換わります。', replaceData: 'データを置き換える',
      badBackup: 'バックアップを読み込めません。このアプリから出力した JSON ファイルを選んでください。',
      importFailed: '読み込んだデータを保存できませんでした。', importComplete: 'バックアップを読み込みました。',
      installMessage: '端末にインストールして、アプリのように開けます。',
      installNow: 'インストール', installHelp: 'インストール方法', installDismiss: 'インストール案内を閉じる', installEntry: 'アプリをインストール',
      installGuideIOS: 'Safari でこのページを開き、「共有」から「ホーム画面に追加」を選びます。「Webアプリとして開く」が表示されたらオンにして、「追加」をタップします。',
      installGuideMac: 'Safari の「共有」から「Dockに追加」を選び、「追加」をクリックします。',
      installGuideAndroid: 'Chrome でこのページを開き、右上のメニューからアプリのインストールかホーム画面への追加を選びます。',
      installGuideDesktop: 'アドレスバーかブラウザーのメニューでインストール項目を探してください。表示されない場合は Chrome または Edge で開けます。'
    },
    en: {
      pageTitle: 'Long-term Goals and Tasks', language: 'Language',
      goalsHeading: 'Long-term goals', checklistHeading: 'Tasks',
      taskViews: 'Task views', boardHeading: 'Four quadrants', todayHeading: 'Today', pastHeading: 'Past tasks',
      todayProgress: '{value} of {total} completed',
      importantUrgent: 'Important and urgent', importantNotUrgent: 'Important, not urgent',
      notImportantUrgent: 'Urgent, not important', notImportantNotUrgent: 'Neither important nor urgent', unclassified: 'Unclassified',
      planForToday: 'Add to today', plannedToday: 'Added to today', planForTodayItem: 'Add “{value}” to today',
      removeFromToday: 'Remove from today', removeFromTodayItem: 'Remove “{value}” from today', taskUnplanned: 'Removed “{value}” from today',
      planDate: 'Originally planned for {value}', taskPlanned: 'Added “{value}” to today',
      emptyToday: 'Nothing planned for today yet.', pickTodayTasks: 'Choose tasks from Four quadrants', undo: 'Undo', taskPlanRestored: 'Restored the plan for “{value}”',
      swipeHint: 'Swipe left to archive or right to add to today. You can also use “⋯”.',
      moreTaskActions: 'More actions for “{value}”', closeTags: 'Close',
      add: 'Add', taskPrompt: 'What do you need to do?',
      goalTitle: 'Goal name', deadline: 'Due date (optional)', clearDeadline: 'Clear due date', priority: 'Priority', priorityValue: 'Priority {value}',
      addGoal: 'Add goal', saveGoal: 'Save goal', editGoal: 'Edit goal',
      goalNote: 'Goal notes', notePrompt: 'Capture context, ideas, or how to proceed',
      subtasks: 'Subtasks', stepPrompt: 'What’s the next step?', addStep: 'Add subtask',
      addToTasks: 'Add to tasks', removeFromTasks: 'Remove from tasks', removeFromArchivedTasks: 'Remove archived entry', source: 'From {value}',
      tags: 'Tags', taskTags: 'Tags for “{value}”', importance: 'Importance', urgency: 'Urgency',
      unset: 'Not set', important: 'Important', notImportant: 'Not important', urgent: 'Urgent', notUrgent: 'Not urgent',
      dueToday: 'Due today', daysLeft: '{value} days left', dayLeft: '1 day left',
      daysOverdue: '{value} days late', dayOverdue: '1 day late',
      requireTitle: 'Enter a name', taskAdded: 'Added “{value}”', stepAdded: 'Added subtask “{value}”',
      linkedTaskAdded: 'Added “{value}” to tasks', linkedTaskRemoved: 'Removed “{value}” from tasks',
      navigation: 'Page navigation', home: 'Home', archiveHeading: 'Archived', archive: 'Archive', restore: 'Restore',
      settingsHeading: 'Settings', historyHeading: 'Release history', currentVersion: 'Current version {value}',
      releaseHistoryUnavailable: 'Release history is available in published builds.',
      updatesHeading: 'Updates', checkUpdates: 'Check for updates', updateSchedule: 'Checks automatically every 24 hours while the app is open.',
      checkingUpdates: 'Checking for updates…', upToDate: 'You’re on the latest version ({value}).',
      updateAvailable: 'Version {value} is available', updateLater: 'Later', updateNow: 'Update now',
      updateDescription: 'The app will reload. Your saved goals, tasks, and settings will be kept.',
      updateCheckFailed: 'Couldn’t check for updates. Try again later.', updatesUnavailable: 'Open the published app or local preview to check for updates.',
      updating: 'Preparing the update…', updateFailed: 'The update couldn’t finish. Try again later or check for updates in Settings.',
      updateDraft: 'Save or clear your goal or task drafts before updating.', updateSaveFailed: 'Your changes are unsaved. Resolve the save issue before updating.',
      archiveItem: 'Archive “{value}”', restoreItem: 'Restore “{value}”', deleteItem: 'Permanently delete “{value}”',
      emptyArchiveGoals: 'No archived goals.',
      emptyArchiveTasks: 'No archived tasks.', archived: 'Archived “{value}”', restored: 'Restored “{value}”',
      deleteHeading: 'Delete permanently?', delete: 'Delete permanently', cancel: 'Cancel', deleted: 'Permanently deleted “{value}”',
      deleteGoalPrompt: 'Permanently delete “{value}”, its notes, and subtasks that only belong to this goal. Subtasks already added to Tasks will be kept as standalone tasks.',
      deleteTaskPrompt: 'Permanently delete “{value}” and its tags.',
      deleteLinkedTaskPrompt: 'Permanently remove “{value}” and its tags from Tasks. The subtask will remain in its goal.',
      storageReadError: 'Could not load saved data. Sample data is shown.',
      storageWriteError: 'Could not save. Changes are available while this page stays open.', retryStorage: 'Retry saving', storageSaved: 'Saved',
      storageConflict: 'Local data was replaced or cleared in another tab. Export this tab’s backup before refreshing if you want to keep your edits.',
      dataSettings: 'Data backup', localData: 'Tasks are saved in this browser. Export a backup before switching devices or clearing site data.',
      exportBackup: 'Export backup', importBackup: 'Import backup', importHeading: 'Import backup?',
      importDescription: 'Importing replaces the goals, tasks, and app settings in this browser.', replaceData: 'Replace data',
      badBackup: 'Could not read this backup. Choose a JSON file exported by this app.',
      importFailed: 'Could not save the imported data.', importComplete: 'Backup imported.',
      installMessage: 'Install Tasks to open it like an app.',
      installNow: 'Install app', installHelp: 'How to install', installDismiss: 'Dismiss install tip', installEntry: 'Install app',
      installGuideIOS: 'Open this page in Safari, tap Share, then Add to Home Screen. Turn on Open as Web App if shown, then tap Add.',
      installGuideMac: 'In Safari, click Share, choose Add to Dock, then click Add.',
      installGuideAndroid: 'Open this page in Chrome. From the menu at the top right, choose to install the app or add it to your home screen.',
      installGuideDesktop: 'Look for an install option in the address bar or browser menu. If it’s missing, open this page in Chrome or Edge.'
    }
  };
  let baseline;
  let storageReadFailed = false;
  try {
    baseline = store.read();
  } catch {
    storageReadFailed = true;
  }
  let needsInitialSave = baseline === null;
  baseline ??= exampleSnapshot();
  let { goals, checklistTasks, locale, quadrantOpen, epoch } = openSnapshot(baseline);
  let pendingSnapshot = baseline;
  let saveInProgress;
  let refreshPending = false;
  let pendingImport;
  let importing = false;
  let displayedDay = localDate(new Date());
  let midnightTimer;
  let swipe;
  let pendingUndo;
  let undoTimer;
  let savedNoticeTimer;
  let pendingDeletion;

  function translate(key, value = '') {
    return messages[locale][key].replace('{value}', () => value);
  }

  function localize(root = document) {
    root.querySelectorAll('[data-i18n]').forEach(element => {
      element.textContent = translate(element.dataset.i18n, element.dataset.i18nValue);
    });
    root.querySelectorAll('[data-i18n-label]').forEach(element => {
      element.setAttribute('aria-label', translate(element.dataset.i18nLabel, element.dataset.i18nValue));
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      element.placeholder = translate(element.dataset.i18nPlaceholder);
    });
  }

  function countdown(days) {
    if (days > 0) return translate(days === 1 ? 'dayLeft' : 'daysLeft', days);
    if (days < 0) return translate(days === -1 ? 'dayOverdue' : 'daysOverdue', -days);
    return translate('dueToday');
  }

  function escapeText(text) {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(text).replace(/[&<>"']/g, char => entities[char]);
  }

  function showStorageNotice(key) {
    if (key) storageNotice.dataset.i18n = key;
    else delete storageNotice.dataset.i18n;
    storageNotice.textContent = key ? translate(key) : '';
    storageNotice.hidden = !key;
    retryStorage.hidden = key !== 'storageWriteError';
  }

  function captureState() {
    return snapshotOf({ goals, checklistTasks, locale, quadrantOpen, epoch });
  }

  function saveState() {
    pendingSnapshot = captureState();
    return flushSavings();
  }

  function flushSavings() {
    if (saveInProgress) return saveInProgress;
    saveInProgress = (async () => {
      while (needsInitialSave || pendingSnapshot !== baseline) {
        const next = pendingSnapshot;
        try {
          await store.commit(baseline, next, needsInitialSave);
        } catch (error) {
          showStorageNotice(error instanceof StorageChangedError ? 'storageConflict' : 'storageWriteError');
          return false;
        }
        baseline = next;
        needsInitialSave = false;
      }
      showStorageNotice('');
      return true;
    })().finally(() => {
      saveInProgress = undefined;
      refreshSavedState();
    });
    return saveInProgress;
  }

  function displaySnapshot(snapshot) {
    const expanded = new Set([...goalsRoot.querySelectorAll('[data-goal][open]')].map(card => card.dataset.goal));
    ({ goals, checklistTasks, locale, quadrantOpen, epoch } = openSnapshot(snapshot));
    baseline = pendingSnapshot = snapshot;
    needsInitialSave = false;
    clearUndo();
    goalsRoot.replaceChildren();
    for (const goal of goals) {
      if (!goal.archived) appendGoal(goal).open = expanded.has(goal.id);
    }
    renderLanguage();
    renderChecklist();
    renderView();
    showStorageNotice('');
  }

  function refreshSavedState() {
    if (!refreshPending || saveInProgress || pendingSnapshot !== baseline || importing || importDialog.open ||
        pendingUndo || deleteDialog.open || document.hidden) return;
    const active = document.activeElement;
    if ([goalsRoot, checklistRoot, todayRoot, pastRoot, archiveGoalsRoot, archiveTasksRoot]
      .some(container => container.contains(active))) return;
    if (goalsRoot.querySelector('.edit-goal[open]') || [...goalsRoot.querySelectorAll('.add-step input')]
      .some(input => input.value)) return;

    refreshPending = false;
    let latest;
    try { latest = store.read(); } catch { return; }
    if (!latest) {
      if (!needsInitialSave) showStorageNotice('storageConflict');
      return;
    }
    if (JSON.stringify(latest) !== JSON.stringify(baseline)) displaySnapshot(latest);
  }

  function requestStorageRefresh() {
    refreshPending = true;
    refreshSavedState();
  }

  retryStorage.addEventListener('click', async () => {
    if (!await flushSavings()) return;
    showStorageNotice('storageSaved');
    storageNotice.focus({ preventScroll: true });
    clearTimeout(savedNoticeTimer);
    savedNoticeTimer = setTimeout(() => {
      if (storageNotice.dataset.i18n === 'storageSaved' && document.activeElement !== storageNotice) showStorageNotice('');
    }, 4_000);
  });

  storageNotice.addEventListener('blur', () => {
    if (storageNotice.dataset.i18n === 'storageSaved') showStorageNotice('');
  });

  function showBackupNotice(key, error = false) {
    if (key) backupNotice.dataset.i18n = key;
    else delete backupNotice.dataset.i18n;
    backupNotice.textContent = key ? translate(key) : '';
    backupNotice.hidden = !key;
    backupNotice.toggleAttribute('data-error', error);
  }

  document.querySelector('#export-backup').addEventListener('click', async () => {
    await saveInProgress;
    let snapshot = pendingSnapshot;
    if (pendingSnapshot === baseline) {
      try { snapshot = store.read() ?? snapshot; } catch { /* The on-screen data remains exportable. */ }
    }
    const file = new Blob([JSON.stringify(snapshot, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todo-backup-${localDate(new Date())}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  });

  importButton.addEventListener('click', () => backupFile.click());

  backupFile.addEventListener('change', async () => {
    const [file] = backupFile.files;
    backupFile.value = '';
    if (!file) return;
    showBackupNotice();
    importButton.disabled = true;
    try {
      pendingImport = parseSnapshot(await file.text());
      importDialog.returnValue = '';
      importDialog.showModal();
    } catch {
      showBackupNotice('badBackup', true);
    } finally {
      importButton.disabled = false;
      if (!importDialog.open) importButton.focus({ preventScroll: true });
    }
  });

  importDialog.addEventListener('cancel', event => {
    if (importing) event.preventDefault();
  });

  importDialog.querySelector('form').addEventListener('submit', async event => {
    if (event.submitter?.value !== 'import') return;
    event.preventDefault();
    if (importing || !pendingImport) return;
    importing = true;
    const buttons = importDialog.querySelectorAll('button');
    buttons.forEach(button => { button.disabled = true; });
    try {
      await saveInProgress;
      displaySnapshot(await store.replace(pendingImport));
      showBackupNotice('importComplete');
    } catch {
      showBackupNotice('importFailed', true);
    } finally {
      buttons.forEach(button => { button.disabled = false; });
      importing = false;
      importDialog.close();
    }
  });

  importDialog.addEventListener('close', () => {
    pendingImport = undefined;
    importButton.focus({ preventScroll: true });
  });

  function goalFields(goal = { title: '', priority: 'P2', deadline: '' }) {
    const options = priorities.map(priority =>
      `<option ${priority === goal.priority ? 'selected' : ''}>${priority}</option>`).join('');
    return `
      <label class="wide"><span data-i18n="goalTitle"></span><input name="title" value="${escapeText(goal.title)}" maxlength="80" required></label>
      <div class="goal-deadline">
        <label><span data-i18n="deadline"></span><input type="date" name="deadline" value="${escapeText(goal.deadline)}"></label>
        ${goal.deadline ? '<button type="button" class="quiet-action" data-clear-deadline data-i18n="clearDeadline"></button>' : ''}
      </div>
      <label><span data-i18n="priority"></span><select name="priority">${options}</select></label>
      <button type="submit" data-i18n="${goal.id ? 'saveGoal' : 'addGoal'}"></button>`;
  }

  function tagBadges(task) {
    return tagFields.filter(field => task[field]).map(field => {
      const value = task[field];
      return `<span class="task-tag" data-tag="${field}-${value}" data-i18n="${tagLabels[field][value]}"></span>`;
    }).join('');
  }

  function tagEditor(task) {
    const groups = tagFields.map(field => {
      const choices = Object.entries({ '': 'unset', ...tagLabels[field] }).map(([value, label]) => `
        <label class="tag-choice">
          <input type="radio" name="${task.id}-${field}" data-tag-field="${field}" value="${value}"
            ${(task[field] ?? '') === value ? 'checked' : ''}>
          <span data-i18n="${label}"></span>
        </label>`).join('');
      return `<fieldset class="tag-group">
        <legend data-i18n="${field}"></legend>
        <div class="tag-choices">${choices}</div>
      </fieldset>`;
    }).join('');
    return `<div class="tag-editor" id="tags-${task.id}" hidden>
      <header class="section-head">
        <h4 data-i18n="tags"></h4>
        <button type="button" class="quiet-action" data-close-tags data-i18n="closeTags"></button>
      </header>
      ${groups}
    </div>`;
  }

  function archiveButton(action, type, item) {
    const style = action === 'delete' ? 'danger-action' : 'quiet-action';
    return `<button type="button" class="${style}" data-archive-action="${action}" data-item-type="${type}"
      data-item-id="${item.id}" data-i18n="${action}" data-i18n-label="${action}Item"
      data-i18n-value="${escapeText(item.title)}"></button>`;
  }

  function taskDetails(task, origin, showTags, dateLabel = '', showScheduleStatus = false) {
    return `<span class="task-text">
      <span class="task-title">${escapeText(task.title)}</span>
      ${origin ? `<span class="source" data-i18n="source" data-i18n-value="${escapeText(origin.title)}"></span>` : ''}
      ${dateLabel}
      ${showScheduleStatus ? `<span class="source board-schedule-status" data-i18n="plannedToday"
        ${task.planDate === displayedDay ? '' : 'hidden'}></span>` : ''}
      ${showTags ? `<span class="task-tags">${tagBadges(task)}</span>` : ''}
    </span>`;
  }

  function todayButton(task, inBoard) {
    const unavailable = task.done || task.planDate === displayedDay;
    return `<button type="button" class="quiet-action${inBoard ? ' board-plan' : ''}" data-schedule-task="${task.id}"
      data-i18n="planForToday" data-i18n-label="planForTodayItem" data-i18n-value="${escapeText(task.title)}"
      ${unavailable ? 'hidden disabled' : ''}></button>`;
  }

  function taskMenu(task, actions) {
    return `<details class="task-menu">
      <summary data-i18n-label="moreTaskActions" data-i18n-value="${escapeText(task.title)}"><span aria-hidden="true">⋯</span></summary>
      <div class="task-menu-panel">${actions}</div>
    </details>`;
  }

  function taskRow(task, view) {
    const inGoal = view === 'goal';
    const inChecklist = inGoal && checklistTasks.includes(task);
    const origin = inGoal ? null : goals.find(goal => goal.id === task.goalId);
    let action = '';
    let dateLabel = '';
    if (inGoal) {
      action = `<button type="button" class="secondary" data-plan="${task.id}" data-i18n="${planMessage(task, inChecklist)}"
        ${!inChecklist && task.done ? 'disabled' : ''}></button>`;
    } else if (view === 'board') {
      action = `<div class="row-actions">
          ${todayButton(task, true)}
          ${taskMenu(task, `<button type="button" class="tag-toggle quiet-action" aria-controls="tags-${task.id}" aria-expanded="false"
            data-i18n="tags" data-i18n-label="taskTags" data-i18n-value="${escapeText(task.title)}"></button>
          ${archiveButton('archive', 'task', task)}`)}
        </div>${tagEditor(task)}`;
    } else if (view === 'today') {
      action = `<button type="button" class="quiet-action" data-remove-today="${task.id}"
        data-i18n="removeFromToday" data-i18n-label="removeFromTodayItem" data-i18n-value="${escapeText(task.title)}"></button>`;
    } else if (view === 'past') {
      const formatted = new Date(`${task.planDate}T00:00:00Z`).toLocaleDateString(locale, { dateStyle: 'medium', timeZone: 'UTC' });
      dateLabel = `<time class="plan-date" datetime="${task.planDate}">${escapeText(translate('planDate', formatted))}</time>`;
      action = taskMenu(task, `${todayButton(task, false)}${archiveButton('archive', 'task', task)}`);
    }
    const content = `
      <label class="task-check">
        <input type="checkbox" data-task="${task.id}" ${task.done ? 'checked' : ''}>
        ${taskDetails(task, origin, !inGoal, dateLabel, view === 'board')}
      </label>
      ${action}`;
    return `<li class="task ${view}-task" data-row-task="${task.id}" data-importance="${task.importance ?? ''}">${view === 'past' ? `
      <div class="swipe-preview" aria-hidden="true">
        <span data-swipe-action="right" data-i18n="planForToday"></span>
        <span data-swipe-action="left" data-i18n="archive"></span>
      </div>
      <div class="past-task-content">${content}</div>` : content}
    </li>`;
  }

  function renderSteps(goal, card) {
    const steps = card.querySelector('.steps');
    steps.innerHTML = goal.steps.map(task => taskRow(task, 'goal')).join('');
    localize(steps);
  }

  function goalSummary(goal) {
    return `<summary data-priority="${goal.priority}">
      <span class="goal-title">${escapeText(goal.title)}</span>
      <span class="badge" data-i18n-label="priorityValue" data-i18n-value="${goal.priority}">${goal.priority}</span>
      ${goal.deadline ? `<time class="countdown" datetime="${goal.deadline}"></time>` : ''}
      <span class="arrow" aria-hidden="true"></span>
    </summary>`;
  }

  function renderGoal(goal, card) {
    card.dataset.goal = goal.id;
    card.innerHTML = `${goalSummary(goal)}
      <div class="goal-body">
        <div class="section-head">
          <h3 id="steps-${goal.id}" data-i18n="subtasks"></h3>
          ${archiveButton('archive', 'goal', goal)}
        </div>
        <ul class="steps" aria-labelledby="steps-${goal.id}"></ul>
        <form class="add-row add-step">
          <label class="visually-hidden" for="step-${goal.id}" data-i18n="stepPrompt"></label>
          <input id="step-${goal.id}" name="title" maxlength="160" data-i18n-placeholder="stepPrompt" required>
          <button type="submit" class="secondary" data-i18n="addStep"></button>
        </form>
        <label class="note-label" for="note-${goal.id}" data-i18n="goalNote"></label>
        <textarea id="note-${goal.id}" data-i18n-placeholder="notePrompt"></textarea>
        <details class="edit-goal"><summary><span data-i18n="editGoal"></span><span class="arrow" aria-hidden="true"></span></summary>
          <form class="goal-form edit-fields">${goalFields(goal)}</form>
        </details>
      </div>`;
    card.querySelector('textarea').value = goal.note;
    localize(card);
    renderSteps(goal, card);
    renderCountdowns(card);
  }

  function appendGoal(goal) {
    const card = document.createElement('details');
    card.className = 'goal';
    renderGoal(goal, card);
    const next = goals.slice(goals.indexOf(goal) + 1).find(item => !item.archived);
    const nextCard = next ? goalsRoot.querySelector(`[data-goal="${next.id}"]`) : null;
    goalsRoot.insertBefore(card, nextCard);
    return card;
  }

  function setTagEditorOpen(button, open) {
    button.setAttribute('aria-expanded', open);
    document.getElementById(button.getAttribute('aria-controls')).hidden = !open;
  }

  function quadrantGroup(key) {
    return `<details class="quadrant" data-quadrant="${key}">
      <summary><span data-i18n="${quadrants[key]}"></span><span class="quadrant-count"></span><span class="arrow" aria-hidden="true"></span></summary>
      <ul></ul>
    </details>`;
  }

  function taskQuadrant(task) {
    return task.importance && task.urgency ? `${task.importance}-${task.urgency}` : 'unclassified';
  }

  function renderChecklist() {
    displayedDay = localDate(new Date());
    const expandedId = checklistRoot.querySelector('.tag-toggle[aria-expanded="true"]')?.getAttribute('aria-controls');
    const groups = Object.fromEntries(Object.keys(quadrants).map(key => [key, []]));
    for (const task of checklistTasks) {
      if (!task.checklistArchived) groups[taskQuadrant(task)].push(task);
    }
    checklistRoot.querySelectorAll('[data-quadrant]').forEach(group => {
      const key = group.dataset.quadrant;
      const tasks = groups[key];
      group.open = quadrantOpen[key] ?? (tasks.length > 0);
      group.querySelector('.quadrant-count').textContent = tasks.length;
      group.querySelector('ul').innerHTML = tasks.map(task => taskRow(task, 'board')).join('');
    });
    localize(checklistRoot);
    if (expandedId) {
      const button = checklistRoot.querySelector(`[aria-controls="${expandedId}"]`);
      if (button) {
        button.closest('.quadrant').open = true;
        setTagEditorOpen(button, true);
      }
    }
    renderToday();
  }

  function orderedTodayTasks() {
    return checklistTasks.filter(task => !task.checklistArchived && task.planDate === displayedDay)
      .sort((first, second) => Number(first.done) - Number(second.done));
  }

  function updateTodayProgress(tasks) {
    const completed = tasks.filter(task => task.done).length;
    const numbers = new Intl.NumberFormat(locale);
    const progress = translate('todayProgress', numbers.format(completed)).replace('{total}', numbers.format(tasks.length));
    if (todayProgress.textContent !== progress) todayProgress.textContent = progress;
  }

  function renderToday() {
    swipe = undefined;
    const current = orderedTodayTasks();
    const past = checklistTasks.filter(task => !task.checklistArchived && task.planDate && task.planDate < displayedDay && !task.done);
    todayRoot.innerHTML = current.map(task => taskRow(task, 'today')).join('');
    pastRoot.innerHTML = past.map(task => taskRow(task, 'past')).join('');
    document.querySelector('#no-today-tasks').hidden = current.length > 0;
    pastView.hidden = past.length === 0;
    localize(todayView);
    updateTodayProgress(current);
  }

  function syncTodayCompletion(task) {
    const tasks = orderedTodayTasks();
    const following = tasks[tasks.indexOf(task) + 1];
    const row = todayRoot.querySelector(`[data-row-task="${task.id}"]`);
    const nextRow = following ? todayRoot.querySelector(`[data-row-task="${following.id}"]`) : null;
    if (row && row.nextElementSibling !== nextRow) {
      const focused = document.activeElement;
      todayRoot.insertBefore(row, nextRow);
      if (row.contains(focused)) focused.focus({ preventScroll: true });
    }
    updateTodayProgress(tasks);
  }

  function syncTodayButton(task) {
    const button = checklistRoot.querySelector(`[data-schedule-task="${task.id}"]`);
    if (!button) return;
    const planned = task.planDate === displayedDay;
    button.hidden = task.done || planned;
    button.disabled = button.hidden;
    button.closest('.board-task').querySelector('.board-schedule-status').hidden = !planned;
  }

  function scheduleToday(task) {
    const today = localDate(new Date());
    if (task.done || task.checklistArchived || task.planDate === today) return false;
    clearUndo(task);
    task.planDate = today;
    saveState();
    if (today !== displayedDay) renderChecklist();
    else {
      syncTodayButton(task);
      renderToday();
    }
    status.textContent = translate('taskPlanned', task.title);
    return true;
  }

  function planMessage(task, inChecklist) {
    if (!inChecklist) return 'addToTasks';
    return task.checklistArchived ? 'removeFromArchivedTasks' : 'removeFromTasks';
  }

  function syncPlanButton(task) {
    const button = goalsRoot.querySelector(`[data-plan="${task.id}"]`);
    if (!button) return;
    const inChecklist = checklistTasks.includes(task);
    button.dataset.i18n = planMessage(task, inChecklist);
    button.textContent = translate(button.dataset.i18n);
    button.disabled = task.done && !inChecklist;
  }

  function syncGoalTaskImportance(task) {
    const row = goalsRoot.querySelector(`[data-row-task="${task.id}"]`);
    if (row) row.dataset.importance = task.importance ?? '';
  }

  function removeFromChecklist(task, index) {
    const previous = checklistTasks[index - 1];
    const following = checklistTasks[index + 1];
    const planDate = task.planDate;
    const wasArchived = task.checklistArchived;
    checklistTasks.splice(index, 1);
    delete task.planDate;
    delete task.checklistArchived;
    saveState();
    syncPlanButton(task);
    renderChecklist();

    offerUndo(task, 'linkedTaskRemoved', () => {
      if (checklistTasks.includes(task) || !goals.some(goal => goal.steps.includes(task))) return;
      const previousIndex = checklistTasks.indexOf(previous);
      const followingIndex = checklistTasks.indexOf(following);
      const position = followingIndex >= 0 ? followingIndex
        : previousIndex >= 0 ? previousIndex + 1 : Math.min(index, checklistTasks.length);
      checklistTasks.splice(position, 0, task);
      if (planDate) task.planDate = planDate;
      if (wasArchived) task.checklistArchived = true;
      saveState();
      syncPlanButton(task);
      renderChecklist();
      if (!archiveView.hidden) renderArchive();
      const focusTarget = archiveView.hidden
        ? goalsRoot.querySelector(`[data-plan="${task.id}"]`) ?? document.querySelector('#checklist-heading')
        : document.querySelector('#archive-heading');
      focusTarget.focus({ preventScroll: true });
      status.textContent = translate('linkedTaskAdded', task.title);
    });
  }

  function goalArchiveActions(goal) {
    return `<div class="task-actions archive-goal-actions">
      ${archiveButton('restore', 'goal', goal)}${archiveButton('delete', 'goal', goal)}
    </div>`;
  }

  function archivedTaskRow(task, inGoal) {
    const origin = inGoal ? null : goals.find(goal => goal.id === task.goalId);
    return `<li class="task archive-task" data-importance="${task.importance ?? ''}">
      <label class="task-check"><input type="checkbox" ${task.done ? 'checked' : ''} disabled>
        ${taskDetails(task, origin, true)}
      </label>
      ${inGoal ? '' : taskMenu(task, archiveButton('restore', 'task', task) + archiveButton('delete', 'task', task))}
    </li>`;
  }

  function renderArchive() {
    const expanded = new Set([...archiveGoalsRoot.querySelectorAll('details[open]')].map(card => card.dataset.archivedGoal));
    const archivedGoals = goals.filter(goal => goal.archived);
    const archivedTasks = checklistTasks.filter(task => task.checklistArchived);
    archiveGoalsRoot.innerHTML = archivedGoals.map(goal => `
      <details class="goal" data-archived-goal="${goal.id}" ${expanded.has(goal.id) ? 'open' : ''}>
        ${goalSummary(goal)}
        <div class="goal-body">
          ${goal.note ? `<h3 data-i18n="goalNote"></h3><p class="archive-note">${escapeText(goal.note)}</p>` : ''}
          ${goal.steps.length ? `<h3 id="archived-steps-${goal.id}" data-i18n="subtasks"></h3>
            <ul aria-labelledby="archived-steps-${goal.id}">${goal.steps.map(task => archivedTaskRow(task, true)).join('')}</ul>` : ''}
          ${goalArchiveActions(goal)}
        </div>
      </details>`).join('');
    archiveTasksRoot.innerHTML = archivedTasks.map(task => archivedTaskRow(task, false)).join('');
    document.querySelector('#no-archived-goals').hidden = archivedGoals.length > 0;
    document.querySelector('#no-archived-tasks').hidden = archivedTasks.length > 0;
    localize(archiveView);
    renderCountdowns(archiveGoalsRoot);
  }

  function renderView(focusHeading = false) {
    const page = currentPage();
    const views = { home: homeView, archive: archiveView, settings: settingsView };
    for (const [name, view] of Object.entries(views)) {
      const active = name === page;
      view.hidden = !active;
      const link = document.querySelector(`#${name}-link`);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    renderPageTitle();
    if (page === 'archive') renderArchive();
    if (focusHeading) {
      window.scrollTo(0, 0);
      views[page].querySelector('h1').focus({ preventScroll: true });
    }
  }

  function currentPage() {
    const page = location.hash.slice(1);
    return ['archive', 'settings'].includes(page) ? page : 'home';
  }

  function renderPageTitle() {
    const titles = { home: 'pageTitle', archive: 'archiveHeading', settings: 'settingsHeading' };
    document.title = translate(titles[currentPage()]);
  }

  function clearUndo(item) {
    if (item && pendingUndo?.item !== item) return;
    clearTimeout(undoTimer);
    pendingUndo = undefined;
    undoNotice.hidden = true;
    delete undoMessage.dataset.i18n;
    delete undoMessage.dataset.i18nValue;
    undoMessage.textContent = '';
  }

  function restartUndoTimer() {
    clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      if (!undoNotice.contains(document.activeElement)) clearUndo();
    }, 10_000);
  }

  function offerUndo(item, message, restore) {
    pendingUndo = { item, restore };
    undoMessage.dataset.i18n = message;
    undoMessage.dataset.i18nValue = item.title;
    undoNotice.hidden = false;
    undoMessage.textContent = translate(message, item.title);
    status.textContent = undoMessage.textContent;
    restartUndoTimer();
  }

  document.querySelector('#undo-action').addEventListener('click', () => {
    const action = pendingUndo;
    clearUndo();
    action?.restore();
  });

  undoNotice.addEventListener('focusout', () => {
    if (pendingUndo) restartUndoTimer();
  });

  function setArchived(item, type, archived) {
    const field = type === 'goal' ? 'archived' : 'checklistArchived';
    const originalPlanDate = item.planDate;
    if (archived) item[field] = true;
    else {
      delete item[field];
      clearUndo(item);
    }
    if (type === 'task' && archived) delete item.planDate;
    saveState();

    if (type === 'goal') {
      if (archived) goalsRoot.querySelector(`[data-goal="${item.id}"]`).remove();
      else appendGoal(item);
    } else {
      syncPlanButton(item);
      renderChecklist();
    }

    if (!archived) renderArchive();
    const heading = archiveView.hidden
      ? (type === 'goal' ? '#goals-heading' : '#checklist-heading')
      : (type === 'goal' ? '#archived-goals-heading' : '#archived-tasks-heading');
    document.querySelector(heading).focus({ preventScroll: true });
    if (archived) {
      offerUndo(item, 'archived', () => {
        const entries = type === 'goal' ? goals : checklistTasks;
        if (!entries.includes(item) || !item[field]) return;
        if (type === 'task' && originalPlanDate) item.planDate = originalPlanDate;
        setArchived(item, type, false);
      });
    } else {
      status.textContent = translate('restored', item.title);
    }
  }

  function deleteArchived(item, type) {
    clearUndo(item);
    if (type === 'goal') {
      for (const step of item.steps) {
        if (checklistTasks.includes(step)) step.goalId = null;
      }
      goals.splice(goals.indexOf(item), 1);
    } else {
      checklistTasks.splice(checklistTasks.indexOf(item), 1);
      delete item.checklistArchived;
      delete item.planDate;
      for (const field of tagFields) delete item[field];
      syncPlanButton(item);
      syncGoalTaskImportance(item);
    }
    saveState();
    renderChecklist();
    renderArchive();
    document.querySelector(type === 'goal' ? '#archived-goals-heading' : '#archived-tasks-heading').focus({ preventScroll: true });
    status.textContent = translate('deleted', item.title);
  }

  function requireTitle(input) {
    const title = input.value.trim();
    if (!title) {
      input.setCustomValidity(translate('requireTitle'));
      input.reportValidity();
    }
    return title;
  }

  function saveGoalFields(form, goal) {
    const title = requireTitle(form.elements.title);
    if (!title) return null;
    const { deadline, priority } = form.elements;
    if (goal) Object.assign(goal, { title, deadline: deadline.value, priority: priority.value });
    return goal ?? makeGoal(title, priority.value, deadline.value);
  }

  document.addEventListener('input', event => {
    if (event.target.matches('input[name="title"]')) event.target.setCustomValidity('');
    if (event.target.matches('.goal textarea')) {
      const goal = goals.find(item => item.id === event.target.closest('.goal').dataset.goal);
      goal.note = event.target.value;
      saveState();
    }
  });

  languagePicker.addEventListener('change', () => {
    locale = languagePicker.value;
    renderLanguage();
    renderToday();
    saveState();
  });

  function selectTaskView(view) {
    refreshLocalDay();
    const showToday = view === 'today';
    todayView.hidden = !showToday;
    boardView.hidden = showToday;
    taskViewSwitch.querySelectorAll('button').forEach(option => option.setAttribute('aria-pressed', option.dataset.taskView === view));
  }

  taskViewSwitch.addEventListener('click', event => {
    const button = event.target.closest('[data-task-view]');
    if (button) selectTaskView(button.dataset.taskView);
  });

  document.querySelector('#pick-today-tasks').addEventListener('click', () => {
    selectTaskView('board');
    taskViewSwitch.querySelector('[data-task-view="board"]').focus({ preventScroll: true });
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-schedule-task]');
    if (!button) return;
    const task = checklistTasks.find(item => item.id === button.dataset.scheduleTask);
    if (!task || !scheduleToday(task)) return;
    const list = button.classList.contains('board-plan') ? checklistRoot : todayRoot;
    list.querySelector(`input[data-task="${task.id}"]`)?.focus({ preventScroll: true });
  });

  todayRoot.addEventListener('click', event => {
    const button = event.target.closest('[data-remove-today]');
    if (!button) return;
    const task = checklistTasks.find(item => item.id === button.dataset.removeToday);
    if (!task || task.checklistArchived || task.planDate !== localDate(new Date())) {
      refreshLocalDay();
      return;
    }

    const row = button.closest('.today-task');
    const neighbor = row.nextElementSibling ?? row.previousElementSibling;
    const originalPlanDate = task.planDate;
    delete task.planDate;
    saveState();
    syncTodayButton(task);
    renderToday();

    const nextButton = neighbor && todayRoot.querySelector(`[data-remove-today="${neighbor.dataset.rowTask}"]`);
    (nextButton ?? taskViewSwitch.querySelector('[data-task-view="today"]')).focus({ preventScroll: true });
    offerUndo(task, 'taskUnplanned', () => {
      if (!checklistTasks.includes(task) || task.checklistArchived || task.planDate) return;
      task.planDate = originalPlanDate;
      saveState();
      renderChecklist();
      const view = todayView.hidden ? boardView : todayView;
      const checkbox = view.querySelector(`input[data-task="${task.id}"]`);
      if (archiveView.hidden) (checkbox ?? taskViewSwitch.querySelector('[aria-pressed="true"]')).focus({ preventScroll: true });
      else document.querySelector('#archive-heading').focus({ preventScroll: true });
      status.textContent = translate('taskPlanRestored', task.title);
    });
  });

  pastRoot.addEventListener('pointerdown', event => {
    const row = event.target.closest('.past-task');
    if (!row || !event.isPrimary || event.pointerType === 'mouse' || event.target.closest('.task-menu, button, input')) return;
    swipe = { row, pointerId: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false };
  });

  pastRoot.addEventListener('pointermove', event => {
    if (swipe?.pointerId !== event.pointerId) return;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    if (!swipe.horizontal) {
      if (Math.abs(dy) > 12 && Math.abs(dy) >= Math.abs(dx)) swipe = undefined;
      else if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        swipe.horizontal = true;
        swipe.row.setPointerCapture(event.pointerId);
        closeTaskMenus();
      }
    }
    if (!swipe?.horizontal) return;
    swipe.row.dataset.swipe = dx < 0 ? 'left' : 'right';
    swipe.row.toggleAttribute('data-swipe-ready', isSwipeReady(dx, dy));
  });

  function isSwipeReady(dx, dy) {
    return Math.abs(dx) >= swipeThreshold && Math.abs(dx) > Math.abs(dy) * 1.25;
  }

  function endSwipe(event) {
    if (swipe?.pointerId !== event.pointerId) return;
    if (event.type === 'lostpointercapture' && event.target !== swipe.row) return;
    const { row, x, y, horizontal } = swipe;
    swipe = undefined;
    delete row.dataset.swipe;
    row.removeAttribute('data-swipe-ready');
    if (event.type !== 'pointerup' || !horizontal) return;
    const dx = event.clientX - x;
    if (!isSwipeReady(dx, event.clientY - y)) return;
    const task = checklistTasks.find(item => item.id === row.dataset.rowTask);
    if (!task || !task.planDate || task.planDate >= localDate(new Date()) || task.done || task.checklistArchived) return;
    if (dx < 0) setArchived(task, 'task', true);
    else scheduleToday(task);
  }

  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    pastRoot.addEventListener(event, endSwipe);
  }

  function closeTaskMenus(except) {
    document.querySelectorAll('.task-menu[open]').forEach(menu => {
      if (menu !== except) menu.open = false;
    });
  }

  document.addEventListener('toggle', event => {
    const menu = event.target;
    if (!menu.matches('.task-menu[open]')) return;
    closeTaskMenus(menu);
    const trigger = menu.querySelector('summary').getBoundingClientRect();
    const panelHeight = menu.querySelector('.task-menu-panel').offsetHeight + 4;
    menu.classList.toggle('opens-up', trigger.bottom + panelHeight > innerHeight && trigger.top >= panelHeight);
  }, true);

  document.addEventListener('click', event => closeTaskMenus(event.target.closest('.task-menu')));

  document.addEventListener('focusin', event => {
    if (!deleteDialog.contains(event.target)) closeTaskMenus(event.target.closest('.task-menu'));
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const menu = event.target.closest('.task-menu[open]');
    const editor = event.target.closest('.tag-editor');
    if (menu) {
      menu.open = false;
      menu.querySelector('summary').focus();
      event.preventDefault();
    } else if (editor) {
      const close = editor.querySelector('[data-close-tags]');
      close.click();
      event.preventDefault();
    }
  });

  checklistRoot.addEventListener('click', event => {
    const summary = event.target.closest('.quadrant > summary');
    if (summary) {
      event.preventDefault();
      const group = summary.parentElement;
      group.open = !group.open;
      quadrantOpen[group.dataset.quadrant] = group.open;
      const expanded = group.querySelector('.tag-toggle[aria-expanded="true"]');
      if (!group.open && expanded) setTagEditorOpen(expanded, false);
      saveState();
      return;
    }
    const action = event.target.closest('.tag-toggle, [data-close-tags]');
    if (!action) return;
    const row = action.closest('.board-task');
    const button = row.querySelector('.tag-toggle');
    const expanded = checklistRoot.querySelector('.tag-toggle[aria-expanded="true"]');
    if (expanded) setTagEditorOpen(expanded, false);
    const menu = row.querySelector('.task-menu');
    menu.open = false;
    if (action === button && button !== expanded) {
      setTagEditorOpen(button, true);
      row.querySelector('.tag-editor input:checked').focus({ preventScroll: true });
    } else {
      menu.querySelector('summary').focus({ preventScroll: true });
    }
  });

  checklistRoot.addEventListener('change', event => {
    const choice = event.target;
    if (!choice.matches('input[data-tag-field]')) return;
    const row = choice.closest('.task');
    const id = row.querySelector('input[data-task]').dataset.task;
    const task = checklistTasks.find(item => item.id === id);
    const field = choice.dataset.tagField;
    const previousGroup = taskQuadrant(task);
    if (choice.value) task[field] = choice.value;
    else delete task[field];
    if (field === 'importance') syncGoalTaskImportance(task);
    saveState();
    if (previousGroup !== taskQuadrant(task)) {
      renderChecklist();
      document.getElementById(`tags-${id}`).querySelector(`[data-tag-field="${field}"][value="${choice.value}"]`).focus();
    } else {
      row.dataset.importance = task.importance ?? '';
      const badges = row.querySelector('.task-tags');
      badges.innerHTML = tagBadges(task);
      localize(badges);
      renderToday();
    }
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-archive-action]');
    if (!button) return;
    const { archiveAction, itemType, itemId } = button.dataset;
    const entries = itemType === 'goal' ? goals : checklistTasks;
    const item = entries.find(entry => entry.id === itemId);
    if (!item) return;
    const archived = itemType === 'goal' ? item.archived : item.checklistArchived;

    if (archiveAction === 'archive' && !archived) setArchived(item, itemType, true);
    if (archiveAction === 'restore' && archived) setArchived(item, itemType, false);
    if (archiveAction === 'delete' && archived && !deleteDialog.open) {
      const menu = button.closest('.task-menu');
      pendingDeletion = { item, type: itemType, returnFocus: menu?.querySelector('summary') ?? button };
      const prompt = itemType === 'goal' ? 'deleteGoalPrompt'
        : item.goalId ? 'deleteLinkedTaskPrompt' : 'deleteTaskPrompt';
      deleteDescription.textContent = translate(prompt, item.title);
      deleteDialog.returnValue = '';
      deleteDialog.showModal();
      if (menu) menu.open = false;
    }
  });

  deleteDialog.addEventListener('close', () => {
    const deletion = pendingDeletion;
    pendingDeletion = undefined;
    if (!deletion) return;
    if (deleteDialog.returnValue === 'delete') deleteArchived(deletion.item, deletion.type);
    else if (!archiveView.hidden && deletion.returnFocus.isConnected) deletion.returnFocus.focus({ preventScroll: true });
  });

  addGoalToggle.addEventListener('click', () => {
    const open = addGoalForm.hidden;
    addGoalForm.hidden = !open;
    addGoalToggle.setAttribute('aria-expanded', String(open));
    if (open) addGoalForm.elements.title.focus();
  });

  addGoalForm.addEventListener('submit', event => {
    event.preventDefault();
    const goal = saveGoalFields(addGoalForm);
    if (!goal) return;
    goals.push(goal);
    saveState();
    const card = appendGoal(goal);
    addGoalForm.reset();
    addGoalForm.hidden = true;
    addGoalToggle.setAttribute('aria-expanded', 'false');
    card.open = true;
    card.querySelector('.add-step input').focus();
  });

  addTaskForm.addEventListener('submit', event => {
    event.preventDefault();
    const input = addTaskForm.elements.title;
    const title = requireTitle(input);
    if (!title) return;
    checklistTasks.push(makeTask(title));
    saveState();
    renderChecklist();
    addTaskForm.reset();
    input.focus();
    status.textContent = translate('taskAdded', title);
  });

  goalsRoot.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target;
    const card = form.closest('.goal');
    const goal = goals.find(item => item.id === card.dataset.goal);
    if (form.matches('.add-step')) {
      const title = requireTitle(form.elements.title);
      if (!title) return;
      goal.steps.push(makeTask(title, goal.id));
      saveState();
      renderSteps(goal, card);
      form.reset();
      form.elements.title.focus();
      status.textContent = translate('stepAdded', title);
    } else if (saveGoalFields(form, goal)) {
      saveState();
      renderGoal(goal, card);
      renderChecklist();
      card.querySelector('summary').focus();
    }
  });

  goalsRoot.addEventListener('click', event => {
    const button = event.target.closest('button[data-plan], button[data-clear-deadline]');
    if (!button) return;
    if (button.hasAttribute('data-clear-deadline')) {
      const deadline = button.form.elements.deadline;
      deadline.value = '';
      deadline.focus();
      return;
    }
    const goal = goals.find(item => item.id === button.closest('.goal').dataset.goal);
    const task = goal.steps.find(step => step.id === button.dataset.plan);
    const index = checklistTasks.indexOf(task);
    if (index >= 0) {
      removeFromChecklist(task, index);
      button.closest('li').querySelector('input').focus();
      return;
    }
    if (task.done) return;
    clearUndo(task);
    checklistTasks.push(task);
    saveState();
    syncPlanButton(task);
    button.closest('li').querySelector('input').focus();
    renderChecklist();
    status.textContent = translate('linkedTaskAdded', task.title);
  });

  document.addEventListener('change', event => {
    const checkbox = event.target;
    if (!checkbox.matches('input[data-task]')) return;
    const id = checkbox.dataset.task;
    const task = checklistTasks.find(item => item.id === id)
      ?? goals.flatMap(goal => goal.steps).find(item => item.id === id);
    task.done = checkbox.checked;
    saveState();
    document.querySelectorAll(`input[data-task="${id}"]`).forEach(input => {
      input.checked = task.done;
    });
    syncPlanButton(task);
    syncTodayButton(task);
    if (task.planDate === displayedDay) {
      syncTodayCompletion(task);
    } else if (task.planDate && task.planDate < displayedDay) {
      renderToday();
      if (checkbox.closest('.past-task')) taskViewSwitch.querySelector('[data-task-view="today"]').focus({ preventScroll: true });
    }
  });

  function renderCountdowns(root = document) {
    const today = Date.parse(localDate(new Date()));
    const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
    root.querySelectorAll('.countdown').forEach(label => {
      const [year, month, day] = label.dateTime.split('-').map(Number);
      const deadline = new Date(0);
      deadline.setUTCFullYear(year, month - 1, day);
      const days = Math.round((deadline - today) / 86_400_000);
      label.textContent = Number.isFinite(days) ? countdown(days) : label.dateTime;
      label.title = Number.isFinite(days) ? dateFormat.format(deadline) : label.dateTime;
      label.toggleAttribute('data-due', days <= 0);
    });
  }

  function renderLanguage() {
    document.documentElement.lang = locale;
    languagePicker.value = locale;
    renderPageTitle();
    localize();
    const history = release.history ?? [];
    document.querySelector('#current-version').textContent = history.length
      ? translate('currentVersion', history[0].version) : translate('releaseHistoryUnavailable');
    document.querySelector('#release-history').innerHTML = history.map(({ version, notes }) =>
      `<li><strong>${escapeText(version)}</strong><p>${escapeText(notes[locale])}</p></li>`).join('');
    document.querySelectorAll('input[name="title"]').forEach(input => {
      if (input.validity.customError) input.setCustomValidity(translate('requireTitle'));
    });
    renderCountdowns();
  }

  function refreshLocalDay() {
    if (localDate(new Date()) !== displayedDay) renderChecklist();
  }

  function checkDates() {
    refreshLocalDay();
    renderCountdowns();
  }

  function scheduleMidnightCheck() {
    clearTimeout(midnightTimer);
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    midnightTimer = setTimeout(() => {
      checkDates();
      scheduleMidnightCheck();
    }, Math.max(1, midnight.getTime() - Date.now()));
  }

  globalThis.setupTodoInstallPrompt(window, translate);

  addGoalForm.innerHTML = goalFields();
  const classifiedKeys = Object.keys(quadrants).filter(key => key !== 'unclassified');
  checklistRoot.innerHTML = `${quadrantGroup('unclassified')}<div class="quadrant-grid">${classifiedKeys.map(quadrantGroup).join('')}</div>`;
  renderLanguage();
  goals.filter(goal => !goal.archived).forEach(appendGoal);
  renderChecklist();
  renderView();
  if (storageReadFailed) showStorageNotice('storageReadError');
  if (needsInitialSave) flushSavings();
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) requestStorageRefresh();
  });
  document.addEventListener('focusout', () => {
    if (refreshPending) queueMicrotask(refreshSavedState);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    checkDates();
    scheduleMidnightCheck();
    requestStorageRefresh();
  });
  window.addEventListener('focus', () => {
    checkDates();
    requestStorageRefresh();
  });
  setInterval(checkDates, 60_000);
  scheduleMidnightCheck();
  window.addEventListener('hashchange', () => {
    if (deleteDialog.open) deleteDialog.close();
    renderView(true);
  });

  async function prepareReload() {
    const draftFields = document.querySelectorAll('#add-task input, .add-step input, .goal-form input, .goal-form select');
    const hasDraft = [...draftFields].some(field => field.matches('select')
      ? !field.selectedOptions[0]?.defaultSelected : field.value !== field.defaultValue || field.validity.badInput);
    if (hasDraft) return 'updateDraft';
    if (importing || ((needsInitialSave || pendingSnapshot !== baseline || saveInProgress) && !await flushSavings())) {
      return 'updateSaveFailed';
    }
  }

  const serviceWorker = webPage && window.isSecureContext ? navigator.serviceWorker : undefined;
  const registration = serviceWorker?.register('./service-worker.js', { updateViaCache: 'none' }).catch(error => {
    console.warn('Offline setup failed', error);
  });
  globalThis.setupTodoUpdates({ build: release.build, registration, serviceWorker, translate, prepareReload });
})();

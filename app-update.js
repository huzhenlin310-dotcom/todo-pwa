(() => {
  const interval = 24 * 60 * 60 * 1000;

  function validRelease(release) {
    return typeof release?.build === 'string' && /^[a-f0-9]{20}$/.test(release.build) &&
      typeof release.version === 'string' && release.version.length > 0;
  }

  function waitFor(target, type, read, signal) {
    return new Promise((resolve, reject) => {
      function stop() {
        target.removeEventListener(type, check);
        signal.removeEventListener('abort', abort);
      }
      function abort() {
        stop();
        reject(signal.reason);
      }
      function check(event) {
        try {
          const result = read(event);
          if (result === undefined) return;
          stop();
          resolve(result);
        } catch (error) {
          stop();
          reject(error);
        }
      }
      if (signal.aborted) return abort();
      target.addEventListener(type, check);
      signal.addEventListener('abort', abort, { once: true });
      check();
    });
  }

  async function activateRelease(registration, serviceWorker, build) {
    await registration.update().catch(() => {});
    const worker = registration.installing ?? registration.waiting ?? registration.active;
    if (!worker) throw new Error('The new service worker is unavailable');
    const signal = AbortSignal.timeout(25_000);
    await waitFor(worker, 'statechange', () => {
      if (worker.state === 'redundant') throw new Error('The new service worker could not install');
      if (['installed', 'activating', 'activated'].includes(worker.state)) return true;
    }, signal);

    const { port1, port2 } = new MessageChannel();
    try {
      port1.start();
      worker.postMessage({ type: 'activate-update', build }, [port2]);
      if (!await waitFor(port1, 'message', event => event?.data, signal)) {
        throw new Error('The service worker is for a different release');
      }
    } finally {
      port1.close();
    }
    await waitFor(serviceWorker, 'controllerchange', () => serviceWorker.controller === worker || undefined, signal);
  }

  globalThis.setupTodoUpdates = ({ build, registration, serviceWorker, translate, prepareReload }) => {
    const checkButton = document.querySelector('#check-updates');
    const showButton = document.querySelector('#show-update');
    const status = document.querySelector('#update-status');
    const dialog = document.querySelector('#update-dialog');
    const heading = document.querySelector('#available-update-heading');
    const progress = document.querySelector('#update-progress');
    const applyButton = document.querySelector('#apply-update');
    const laterButton = document.querySelector('#update-later');

    function message(element, key, value = '') {
      element.dataset.i18n = key;
      element.dataset.i18nValue = value;
      element.textContent = translate(key, value);
    }

    if (!build) {
      checkButton.disabled = true;
      message(status, 'updatesUnavailable');
      return;
    }

    const versionUrl = new URL('./version.json', location.href);
    const checkKey = `todo-update:${versionUrl.pathname}`;
    let nextCheckAt = 0;
    let available;
    let promptPending = false;
    let checkTimer;
    let checking = false;
    let checkFailed = false;
    let applying = false;

    function showPrompt() {
      if (!available || !promptPending || document.hidden || document.querySelector('dialog[open]')) return;
      promptPending = false;
      progress.textContent = '';
      delete progress.dataset.i18n;
      message(heading, 'updateAvailable', available.version);
      dialog.showModal();
    }

    function showResult(latest) {
      available = latest.build === build ? undefined : latest;
      showButton.hidden = !available;
      message(status, available ? 'updateAvailable' : 'upToDate', latest.version);
      if (dialog.open) {
        if (available) message(heading, 'updateAvailable', available.version);
        else dialog.close();
        return;
      }
      promptPending = Boolean(available);
      showPrompt();
    }

    try {
      const saved = JSON.parse(localStorage.getItem(checkKey));
      const elapsed = Date.now() - saved?.checkedAt;
      if (saved?.build === build && elapsed >= 0 && elapsed < interval && validRelease(saved.latest)) {
        nextCheckAt = saved.checkedAt + interval;
        showResult(saved.latest);
      }
    } catch { /* Update checks still work when storage is unavailable. */ }

    function scheduleCheck() {
      clearTimeout(checkTimer);
      checkTimer = setTimeout(check, Math.max(0, nextCheckAt - Date.now()));
    }

    async function check() {
      if (checking || applying) return;
      checking = checkButton.disabled = applyButton.disabled = true;
      message(status, 'checkingUpdates');
      try {
        versionUrl.searchParams.set('check', Date.now());
        const response = await fetch(versionUrl, { cache: 'no-store', signal: AbortSignal.timeout(15_000) });
        if (!response.ok) throw new Error(`Update check returned ${response.status}`);
        const latest = await response.json();
        if (!validRelease(latest)) throw new Error('Invalid version information');
        const checkedAt = Date.now();
        try { localStorage.setItem(checkKey, JSON.stringify({ build, checkedAt, latest })); } catch { /* Optional. */ }
        checkFailed = false;
        showResult(latest);
      } catch {
        checkFailed = true;
        message(status, 'updateCheckFailed');
      } finally {
        nextCheckAt = Date.now() + interval;
        checking = checkButton.disabled = applyButton.disabled = false;
        scheduleCheck();
      }
    }

    async function apply() {
      if (!available || applying || checking) return;
      const { build: target } = available;
      applying = applyButton.disabled = laterButton.disabled = true;
      message(progress, 'updating');
      try {
        const blocked = await prepareReload();
        if (blocked) {
          message(progress, blocked);
          return;
        }
        const offlineRegistration = await registration;
        if (offlineRegistration) {
          await activateRelease(offlineRegistration, serviceWorker, target);
          location.reload();
        } else {
          if (serviceWorker?.controller) throw new Error('Could not update the active service worker');
          const url = new URL(location.href);
          url.searchParams.set('v', target);
          const page = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15_000) });
          if (!page.ok || !(await page.text()).includes(`<meta name="app-build" content="${target}">`)) {
            throw new Error('The published page does not match the available release');
          }
          location.replace(url);
        }
      } catch {
        message(progress, 'updateFailed');
      } finally {
        applying = applyButton.disabled = laterButton.disabled = false;
        scheduleCheck();
      }
    }

    checkButton.addEventListener('click', check);
    showButton.addEventListener('click', () => {
      promptPending = true;
      showPrompt();
    });
    applyButton.addEventListener('click', apply);
    dialog.addEventListener('cancel', event => {
      if (applying) event.preventDefault();
    });
    for (const other of document.querySelectorAll('dialog:not(#update-dialog)')) {
      other.addEventListener('close', showPrompt);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      if (Date.now() >= nextCheckAt) check();
      showPrompt();
    });
    window.addEventListener('online', () => {
      if (checkFailed || Date.now() >= nextCheckAt) check();
    });
    scheduleCheck();
  };
})();

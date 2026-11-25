(function (root) {
  'use strict';

  const preferenceKey = 'long-term-goals-and-today:install-tip';

  function setupInstallPrompt(view, translate) {
    if (!view.isSecureContext || !/^https?:$/.test(view.location.protocol)) return;

    const { document, navigator } = view;
    const tip = document.getElementById('install-tip');
    const action = document.getElementById('install-action');
    const guide = document.getElementById('install-guide');
    const dismiss = document.getElementById('dismiss-install-tip');
    const entry = document.getElementById('show-install-tip');
    const standalone = view.matchMedia('(display-mode: standalone)');
    const userAgent = navigator.userAgent;
    let preference;
    let nativePrompt;
    let prompting = false;
    let showGuide = false;

    try { preference = view.localStorage.getItem(preferenceKey); } catch { /* Keep the tip usable without storage. */ }

    function remember(value) {
      preference = value;
      try {
        if (value) view.localStorage.setItem(preferenceKey, value);
        else view.localStorage.removeItem(preferenceKey);
      } catch { /* The preference remains available in this tab. */ }
    }

    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) guide.dataset.i18n = 'installGuideIOS';
    else if (/Macintosh/.test(userAgent) && /Version\/.*Safari\//.test(userAgent)) guide.dataset.i18n = 'installGuideMac';
    else if (/Android/.test(userAgent)) guide.dataset.i18n = 'installGuideAndroid';
    else guide.dataset.i18n = 'installGuideDesktop';
    guide.textContent = translate(guide.dataset.i18n);

    function render() {
      const offerInstall = !standalone.matches && !navigator.standalone && preference !== 'installed';
      tip.hidden = !offerInstall || preference === 'dismissed';
      entry.hidden = !offerInstall || preference !== 'dismissed';
      guide.hidden = Boolean(nativePrompt) || !showGuide;
      action.disabled = prompting;
      action.dataset.i18n = nativePrompt ? 'installNow' : 'installHelp';
      action.textContent = translate(action.dataset.i18n);
      if (nativePrompt) {
        action.removeAttribute('aria-controls');
        action.removeAttribute('aria-expanded');
      } else {
        action.setAttribute('aria-controls', 'install-guide');
        action.setAttribute('aria-expanded', String(!guide.hidden));
      }
    }

    function markInstalled() {
      const returnFocus = tip.contains(document.activeElement) || document.activeElement === entry;
      remember('installed');
      nativePrompt = undefined;
      render();
      if (returnFocus) document.querySelector('.view-nav [aria-current="page"]')?.focus({ preventScroll: true });
    }

    view.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      nativePrompt = event;
      showGuide = false;
      // Eligibility can return after an uninstall in the same browser profile.
      if (preference === 'installed') remember(null);
      render();
    });
    view.addEventListener('appinstalled', markInstalled);
    standalone.addEventListener?.('change', render);

    action.addEventListener('click', async () => {
      if (prompting) return;
      if (!nativePrompt) {
        showGuide = !showGuide;
        render();
        return;
      }
      const event = nativePrompt;
      nativePrompt = undefined;
      prompting = true;
      try {
        // Call the native prompt while the click still has user activation.
        const choice = await event.prompt();
        if ((choice ?? await event.userChoice)?.outcome === 'accepted') markInstalled();
      } catch {
        showGuide = true;
      } finally {
        prompting = false;
        render();
      }
    });

    dismiss.addEventListener('click', () => {
      remember('dismissed');
      showGuide = false;
      render();
      document.querySelector('.view-nav [aria-current="page"]')?.focus({ preventScroll: true });
    });
    entry.addEventListener('click', () => {
      remember(null);
      render();
      action.focus();
    });

    render();
  }

  if (typeof module === 'object' && module.exports) module.exports = setupInstallPrompt;
  else root.setupTodoInstallPrompt = setupInstallPrompt;
})(globalThis);

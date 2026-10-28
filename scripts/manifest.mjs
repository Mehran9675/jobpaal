/**
 * Generates manifest.json for each supported browser family.
 * Chromium (Chrome, Edge, Brave, Opera) uses a service worker and the side panel API.
 * Firefox uses an event-page background script and a sidebar action.
 */
export function createManifest(target, version) {
  const base = {
    manifest_version: 3,
    name: 'JobPaal',
    short_name: 'JobPaal',
    version,
    description:
      'Tailor your real resume, cover letter and screening answers to the job you are viewing, using your own AI provider. Local-only, never submits.',
    icons: { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png', 48: 'icons/icon-48.png', 128: 'icons/icon-128.png' },
    action: {
      default_title: 'JobPaal',
      default_popup: 'popup/index.html',
      default_icon: { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png', 48: 'icons/icon-48.png' },
    },
    options_ui: { page: 'options/index.html', open_in_tab: true },
    permissions: ['storage', 'unlimitedStorage', 'contextMenus', 'activeTab', 'scripting', 'clipboardRead', 'notifications', 'tabs', 'webNavigation'],
    host_permissions: ['<all_urls>'],
    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['content.js'],
        run_at: 'document_idle',
        all_frames: true,
        match_about_blank: true,
      },
    ],
    web_accessible_resources: [{ resources: ['icons/*'], matches: ['<all_urls>'] }],
    commands: {
      _execute_action: { suggested_key: { default: 'Alt+J' }, description: 'Open JobPaal' },
    },
  };

  if (target === 'firefox') {
    return {
      ...base,
      background: { scripts: ['background.js'] },
      sidebar_action: {
        default_title: 'JobPaal',
        default_panel: 'sidepanel/index.html',
        default_icon: { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png' },
        open_at_install: false,
      },
      browser_specific_settings: {
        gecko: {
          id: 'jobpaal@jobpaal.app',
          strict_min_version: '115.0',
          data_collection_permissions: { required: ['none'] },
        },
      },
    };
  }

  return {
    ...base,
    minimum_chrome_version: '116',
    permissions: [...base.permissions, 'sidePanel'],
    background: { service_worker: 'background.js' },
    side_panel: { default_path: 'sidepanel/index.html' },
  };
}

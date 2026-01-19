const HIDDEN_CLASS = 'chatgpt-hide-message';
const CONTROLS_ID = 'chatgpt-hide-controls';
const STORAGE_KEY = 'chatgpt-hide-hidden-keys';
const ACTION_BAR_KEY = 'chatgpt-hide-actions';

const loadHiddenKeys = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    return new Set();
  }
};

const saveHiddenKeys = (keys) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(keys)));
  } catch (error) {
    // ignore storage errors
  }
};

const simpleHash = (value) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const getMessageKey = (container) => {
  const messageNode = container.querySelector('[data-message-author-role]');
  const role =
    messageNode?.getAttribute('data-message-author-role') || 'unknown';
  const messageId =
    container.getAttribute('data-message-id') ||
    messageNode?.getAttribute('data-message-id') ||
    container.id;
  if (messageId) {
    return `${role}:${messageId}`;
  }
  const text = messageNode?.textContent?.trim() || container.textContent || '';
  const snippet = text.replace(/\s+/g, ' ').slice(0, 160);
  return `${role}:${simpleHash(snippet)}`;
};

const hiddenKeys = loadHiddenKeys();

const getMessageContainer = (messageNode) => {
  return (
    messageNode.closest('[data-testid="conversation-turn"]') ||
    messageNode.closest('article') ||
    messageNode
  );
};

const hideMessage = (container) => {
  container.classList.add(HIDDEN_CLASS);
  hiddenKeys.add(getMessageKey(container));
  saveHiddenKeys(hiddenKeys);
};

const showMessage = (container) => {
  container.classList.remove(HIDDEN_CLASS);
  hiddenKeys.delete(getMessageKey(container));
  saveHiddenKeys(hiddenKeys);
};

const toggleMessage = (container) => {
  if (container.classList.contains(HIDDEN_CLASS)) {
    showMessage(container);
  } else {
    hideMessage(container);
  }
};

const buildMessageButton = (container) => {
  if (container.querySelector('[data-chatgpt-hide-button="true"]')) {
    return;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = container.classList.contains(HIDDEN_CLASS)
    ? 'Show'
    : 'Hide';
  button.className = 'chatgpt-hide-button';
  button.setAttribute('data-chatgpt-hide-button', 'true');
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleMessage(container);
    button.textContent = container.classList.contains(HIDDEN_CLASS)
      ? 'Show'
      : 'Hide';
  });

  const header = container.querySelector('header') || container;
  header.appendChild(button);
};

const applyButtonsToMessages = () => {
  const messageNodes = document.querySelectorAll(
    '[data-message-author-role="user"], [data-message-author-role="assistant"]'
  );
  messageNodes.forEach((messageNode) => {
    const container = getMessageContainer(messageNode);
    const key = getMessageKey(container);
    if (hiddenKeys.has(key)) {
      container.classList.add(HIDDEN_CLASS);
    }
    buildMessageButton(container);
  });
};

const hideAllMessages = () => {
  const containers = document.querySelectorAll(
    '[data-testid="conversation-turn"], article'
  );
  containers.forEach((container) => {
    if (container.querySelector('[data-message-author-role]')) {
      hideMessage(container);
    }
  });
};

const showAllMessages = () => {
  const containers = document.querySelectorAll(
    '[data-testid="conversation-turn"], article'
  );
  containers.forEach((container) => showMessage(container));
  hiddenKeys.clear();
  saveHiddenKeys(hiddenKeys);
  document
    .querySelectorAll('[data-chatgpt-hide-button="true"]')
    .forEach((button) => {
      button.textContent = 'Hide';
    });
};

const toggleActionBars = () => {
  document.documentElement.classList.toggle('chatgpt-hide-actions');
  persistActionBarState();
  updateActionBarButtonText();
};

const persistActionBarState = () => {
  try {
    localStorage.setItem(
      ACTION_BAR_KEY,
      document.documentElement.classList.contains('chatgpt-hide-actions')
        ? '1'
        : '0'
    );
  } catch (error) {
    // ignore storage errors
  }
};

const updateActionBarButtonText = () => {
  const toggleButton = document.querySelector(
    '#chatgpt-hide-actions-toggle'
  );
  if (!toggleButton) {
    return;
  }
  toggleButton.textContent = document.documentElement.classList.contains(
    'chatgpt-hide-actions'
  )
    ? 'Show action bars'
    : 'Hide action bars';
};

const injectControls = () => {
  if (document.getElementById(CONTROLS_ID)) {
    return;
  }

  const controls = document.createElement('div');
  controls.id = CONTROLS_ID;

  const hideAllButton = document.createElement('button');
  hideAllButton.type = 'button';
  hideAllButton.textContent = 'Hide all Q/A';
  hideAllButton.addEventListener('click', hideAllMessages);

  const showAllButton = document.createElement('button');
  showAllButton.type = 'button';
  showAllButton.textContent = 'Show all Q/A';
  showAllButton.addEventListener('click', showAllMessages);

  const actionBarButton = document.createElement('button');
  actionBarButton.type = 'button';
  actionBarButton.id = 'chatgpt-hide-actions-toggle';
  actionBarButton.textContent = 'Hide action bars';
  actionBarButton.addEventListener('click', toggleActionBars);

  controls.appendChild(hideAllSummary('Chat controls'));
  controls.appendChild(hideAllButton);
  controls.appendChild(showAllButton);
  controls.appendChild(actionBarButton);

  document.body.appendChild(controls);
};

const hideAllSummary = (label) => {
  const summary = document.createElement('div');
  summary.className = 'chatgpt-hide-summary';
  summary.textContent = label;
  return summary;
};

const observeMessages = () => {
  const observer = new MutationObserver(() => {
    applyButtonsToMessages();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

const init = () => {
  if (localStorage.getItem(ACTION_BAR_KEY) === '1') {
    document.documentElement.classList.add('chatgpt-hide-actions');
  }
  injectControls();
  updateActionBarButtonText();
  applyButtonsToMessages();
  observeMessages();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

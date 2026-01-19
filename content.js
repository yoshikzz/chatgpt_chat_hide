const HIDDEN_CLASS = 'chatgpt-hide-message';
const CONTROLS_ID = 'chatgpt-hide-controls';

const getMessageContainer = (messageNode) => {
  return (
    messageNode.closest('[data-testid="conversation-turn"]') ||
    messageNode.closest('article') ||
    messageNode
  );
};

const hideMessage = (container) => {
  container.classList.add(HIDDEN_CLASS);
};

const showMessage = (container) => {
  container.classList.remove(HIDDEN_CLASS);
};

const toggleMessage = (container) => {
  container.classList.toggle(HIDDEN_CLASS);
};

const buildMessageButton = (container) => {
  if (container.querySelector('[data-chatgpt-hide-button="true"]')) {
    return;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Hide';
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
  document
    .querySelectorAll('[data-chatgpt-hide-button="true"]')
    .forEach((button) => {
      button.textContent = 'Hide';
    });
};

const toggleActionBars = () => {
  document.documentElement.classList.toggle('chatgpt-hide-actions');
  const toggleButton = document.querySelector(
    '#chatgpt-hide-actions-toggle'
  );
  if (toggleButton) {
    toggleButton.textContent = document.documentElement.classList.contains(
      'chatgpt-hide-actions'
    )
      ? 'Show action bars'
      : 'Hide action bars';
  }
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
  injectControls();
  applyButtonsToMessages();
  observeMessages();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

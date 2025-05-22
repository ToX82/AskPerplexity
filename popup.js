// Utility: recupera messaggio localizzato
/**
 * Get a localized message by key.
 * @param {string} key
 * @returns {string}
 */
function getMessage(key) {
  return chrome.i18n.getMessage(key) || '';
}

/**
 * Localize all HTML elements with data-i18n and data-i18n-placeholder attributes.
 */
function localizeHtml() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const msg = getMessage(key);
    if (msg) {
      el.textContent = msg;
      if (el.closest('.shortcuts')) {
        el.dataset.text = msg;
      }
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const msg = getMessage(key);
    if (msg) {
      el.setAttribute('placeholder', msg);
    }
  });
  localizeTooltips();
}

/**
 * Localize tooltips for shortcut buttons.
 */
function localizeTooltips() {
  const tooltipKeys = {
    'shortcut_summary': 'shortcut_summary_tooltip',
    'shortcut_keypoints': 'shortcut_keypoints_tooltip',
    'shortcut_qa': 'shortcut_qa_tooltip',
    'shortcut_glossary': 'shortcut_glossary_tooltip',
    'shortcut_translate': 'shortcut_translate_tooltip',
    'shortcut_highlight': 'shortcut_highlight_tooltip',
    'shortcut_by_section': 'shortcut_by_section_tooltip',
    'shortcut_flashcard': 'shortcut_flashcard_tooltip',
    'shortcut_timeline': 'shortcut_timeline_tooltip',
    'shortcut_tone': 'shortcut_tone_tooltip',
    'shortcut_reliability': 'shortcut_reliability_tooltip'
  };
  document.querySelectorAll('.shortcuts button').forEach(btn => {
    const key = btn.getAttribute('data-i18n');
    if (tooltipKeys[key]) {
      const tip = getMessage(tooltipKeys[key]);
      if (tip) {
        btn.setAttribute('data-tooltip', tip);
      }
    }
  });
}

/**
 * Show or hide the spinner on the ask button.
 * @param {boolean} show
 */
function toggleSpinner(show) {
  const askBtn = document.getElementById('ask');
  if (show) {
    askBtn.innerHTML = '<span class="spinner"></span>';
    askBtn.disabled = true;
  } else {
    localizeHtml();
    updateAskBtnState();
  }
}

/**
 * Enable or disable the ask button based on input value.
 */
function updateAskBtnState() {
  const input = document.getElementById('question');
  const askBtn = document.getElementById('ask');
  askBtn.disabled = !input.value.trim();
}

/**
 * Show an error message below the input.
 * @param {string} msg
 */
function showError(msg) {
  const errorMsg = document.getElementById('error-message');
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
}

/**
 * Hide the error message.
 */
function hideError() {
  document.getElementById('error-message').style.display = 'none';
}

/**
 * Gestisce il click su un bottone shortcut.
 * @param {Event} e
 */
function onShortcutClick(e) {
  const button = e.currentTarget;
  const input = document.getElementById('question');
  input.value = button.getAttribute('data-tooltip') || button.dataset.text;
  updateAskBtnState();
  input.focus();
}

/**
 * Gestisce l'invio della domanda.
 * @returns {Promise<void>}
 */
async function onAskClick() {
  const input = document.getElementById('question');
  const userInput = input.value.trim();
  if (!userInput) {
    showError(getMessage('error_empty') || 'Inserisci una domanda.');
    input.focus();
    return;
  }
  hideError();
  toggleSpinner(true);
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const query = encodeURIComponent(`${tab.url} ${userInput}`);
    const url = `https://www.perplexity.ai/search?q=${query}`;
    chrome.tabs.create({ url });
  } finally {
    setTimeout(() => toggleSpinner(false), 800);
  }
}

/**
 * Inizializza tutti gli event listener e la localizzazione.
 */
function initPopup() {
  localizeHtml();
  const input = document.getElementById('question');
  const askBtn = document.getElementById('ask');
  const buttons = document.querySelectorAll('.shortcuts button');

  input.focus();
  updateAskBtnState();

  input.addEventListener('input', () => {
    updateAskBtnState();
    hideError();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      askBtn.click();
    }
  });
  askBtn.addEventListener('click', onAskClick);
  buttons.forEach(button => {
    button.addEventListener('click', onShortcutClick);
  });
}

document.addEventListener('DOMContentLoaded', initPopup);

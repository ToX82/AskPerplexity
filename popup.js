// Funzione per localizzare i testi dinamicamente
function localizeHtml() {
  // Elementi con testo
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const msg = chrome.i18n.getMessage(key);
    if (msg) {
      el.textContent = msg;
      // Se è un bottone shortcut, aggiorno anche il dataset per l'inserimento rapido
      if (el.closest('.shortcuts')) {
        el.dataset.text = msg;
      }
    }
  });
  // Elementi con placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const msg = chrome.i18n.getMessage(key);
    if (msg) {
      el.setAttribute('placeholder', msg);
    }
  });
  // Tooltip localizzati
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
      const tip = chrome.i18n.getMessage(tooltipKeys[key]);
      if (tip) {
        btn.setAttribute('data-tooltip', tip);
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  localizeHtml();

  const input = document.getElementById('question');
  const buttons = document.querySelectorAll('.shortcuts button');
  const askBtn = document.getElementById('ask');
  const errorMsg = document.getElementById('error-message');

  // Focus automatico
  input.focus();

  // Disabilita il pulsante se input vuoto
  function toggleAskBtn() {
    askBtn.disabled = !input.value.trim();
  }
  input.addEventListener('input', () => {
    toggleAskBtn();
    errorMsg.style.display = 'none';
  });
  toggleAskBtn();

  // Shortcut click
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      input.value = button.getAttribute('data-tooltip') || button.dataset.text;
      toggleAskBtn();
      input.focus();
    });
  });

  // Invio con Enter
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      askBtn.click();
    }
  });

  // Spinner
  function showSpinner(show) {
    if (show) {
      askBtn.innerHTML = '<span class="spinner"></span>';
      askBtn.disabled = true;
    } else {
      localizeHtml();
      toggleAskBtn();
    }
  }

  // Invio domanda
  askBtn.addEventListener('click', async () => {
    const userInput = input.value.trim();
    if (!userInput) {
      errorMsg.textContent = chrome.i18n.getMessage('error_empty') || 'Inserisci una domanda.';
      errorMsg.style.display = 'block';
      input.focus();
      return;
    }
    errorMsg.style.display = 'none';
    showSpinner(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const query = encodeURIComponent(`${tab.url} ${userInput}`);
      const url = `https://www.perplexity.ai/search?q=${query}`;
      chrome.tabs.create({ url });
    } finally {
      setTimeout(() => showSpinner(false), 800); // Spinner visibile per almeno 0.8s
    }
  });
});

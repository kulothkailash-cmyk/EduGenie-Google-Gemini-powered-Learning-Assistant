const chatDialog = document.querySelector('#chat-dialog');
const chatMessages = document.querySelector('#chat-messages');
const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-input');
const sendButton = document.querySelector('.send-button');
const toast = document.querySelector('#toast');
const history = [];
let toastTimer;

document.querySelector('#today-date').textContent = new Intl.DateTimeFormat('en', {
  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
}).format(new Date());
document.querySelector('#welcome-date').textContent = new Intl.DateTimeFormat('en', {
  weekday: 'long', month: 'long', day: 'numeric',
}).format(new Date()).toUpperCase();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function addMessage(text, role) {
  const row = document.createElement('div');
  row.className = `message ${role === 'user' ? 'user-message' : 'tutor-message'}`;
  if (role !== 'user') {
    const avatar = document.createElement('span');
    avatar.className = 'message-avatar';
    avatar.textContent = '✳';
    row.append(avatar);
  }
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  const body = document.createElement('p');
  body.textContent = text;
  const time = document.createElement('span');
  time.className = 'message-time';
  time.textContent = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date());
  bubble.append(body, time);
  row.append(bubble);
  chatMessages.append(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function openTutor(prompt = '') {
  if (!chatDialog.open) chatDialog.showModal();
  if (prompt) {
    chatInput.value = prompt;
    chatInput.focus();
  } else {
    chatInput.focus();
  }
}

document.querySelector('#open-tutor').addEventListener('click', () => openTutor());
document.querySelector('#close-chat').addEventListener('click', () => chatDialog.close());
chatDialog.addEventListener('click', (event) => {
  if (event.target === chatDialog) chatDialog.close();
});

document.querySelectorAll('[data-prompt]').forEach((button) => {
  button.addEventListener('click', () => openTutor(button.dataset.prompt));
});

document.querySelector('#view-subjects').addEventListener('click', () => {
  showToast('You’re viewing all your current subjects.');
});

document.querySelector('.help-button').addEventListener('click', () => {
  showToast('Choose a subject or open your AI tutor to get started.');
});

document.querySelector('.settings-button').addEventListener('click', () => {
  showToast('Your study settings are coming soon.');
});

document.querySelector('.note-dismiss').addEventListener('click', () => {
  document.querySelector('.micro-note').remove();
});

document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach((item) => {
      item.classList.remove('active');
      item.removeAttribute('aria-current');
    });
    link.classList.add('active');
    link.setAttribute('aria-current', 'page');
  });
});

chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 110)}px`;
});

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message || sendButton.disabled) return;
  addMessage(message, 'user');
  chatInput.value = '';
  chatInput.style.height = 'auto';
  sendButton.disabled = true;
  sendButton.textContent = '…';

  try {
    const response = await fetch('/api/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The tutor is unavailable right now.');
    history.push({ role: 'user', text: message }, { role: 'model', text: result.reply });
    addMessage(result.reply, 'model');
  } catch (error) {
    addMessage(error.message, 'model');
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = '↑';
    chatInput.focus();
  }
});
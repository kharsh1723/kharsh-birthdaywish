/* =====================================================
   BIRTHDAY SURPRISE — script.js
   Handles: particles, gift-open animation,
            confetti, balloons, gallery lightbox,
            music player.
   ===================================================== */

'use strict';

/* ─── DOM REFERENCES ──────────────────────────────── */
const welcomeScreen      = document.getElementById('welcome-screen');
const celebrationScreen  = document.getElementById('celebration-screen');
const giftWrapper        = document.getElementById('gift-wrapper');
const giftBox            = document.getElementById('gift-box');
const confettiCanvas     = document.getElementById('confetti-canvas');
const balloonsContainer  = document.getElementById('balloons-container');
const playMusicBtn       = document.getElementById('play-music-btn');
const birthdayAudio      = document.getElementById('birthday-audio');
const equalizer          = document.getElementById('equalizer');
const lightbox           = document.getElementById('lightbox');
const lightboxImg        = document.getElementById('lightbox-img');
const lightboxCaption    = document.getElementById('lightbox-caption');
const lightboxClose      = document.getElementById('lightbox-close');

/* ─── STATE ───────────────────────────────────────── */
let confettiPieces  = [];
let confettiRunning = false;
let animFrameId     = null;
let isPlaying       = false;
let giftOpened      = false;   // prevent double-tap


/* =====================================================
   1. BACKGROUND PARTICLES (welcome screen)
   ===================================================== */
(function createParticles() {
  const container = document.getElementById('particles-container');
  const count     = 60;

  for (let i = 0; i < count; i++) {
    const p   = document.createElement('div');
    p.className = 'particle';

    const size   = Math.random() * 4 + 2;     // 2–6 px
    const x      = Math.random() * 100;        // % from left
    const y      = Math.random() * 100;        // % from top
    const dur    = (Math.random() * 3 + 2).toFixed(2);  // 2–5s
    const delay  = (Math.random() * 5).toFixed(2);      // 0–5s

    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}%;
      top: ${y}%;
      --dur: ${dur}s;
      --delay: ${delay}s;
    `;

    // Gold stars mixed with purple specks
    p.style.background = Math.random() > 0.4 ? '#f5c842' : '#c084fc';
    container.appendChild(p);
  }
})();


/* =====================================================
   2. GIFT BOX — CLICK / KEYBOARD OPEN
   ===================================================== */
function openGift() {
  if (giftOpened) return;
  giftOpened = true;

  /* Step 1 — shake */
  giftBox.classList.add('opening');

  /* Step 2 — after shake, open lid */
  setTimeout(() => {
    giftBox.classList.remove('opening');
    giftBox.classList.add('opened');
  }, 500);

  /* Step 3 — fade welcome, show celebration */
  setTimeout(() => {
    welcomeScreen.classList.remove('active');
    celebrationScreen.classList.add('active');

    /* Fire celebratory events */
    launchConfetti();
    launchBalloons();
  }, 1100);
}

/* Click handler */
giftWrapper.addEventListener('click', openGift);

/* Keyboard: Enter or Space triggers open */
giftWrapper.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openGift();
  }
});


/* =====================================================
   3. CONFETTI
   ===================================================== */

/* Colour palette for confetti pieces */
const CONFETTI_COLORS = [
  '#f5c842', '#fde68a', '#7b2ff7', '#c084fc',
  '#f59e0b', '#ffffff', '#e879f9', '#a855f7'
];

/**
 * Initialise and kick off the confetti animation.
 * Pieces spawn from the top and fall with randomised
 * horizontal drift and rotation.
 */
function launchConfetti() {
  const ctx    = confettiCanvas.getContext('2d');
  const W      = window.innerWidth;
  const H      = window.innerHeight;

  confettiCanvas.width  = W;
  confettiCanvas.height = H;

  /* Spawn 180 pieces */
  confettiPieces = [];
  for (let i = 0; i < 180; i++) {
    confettiPieces.push(newPiece(W));
  }

  confettiRunning = true;
  animFrameId = requestAnimationFrame(() => tickConfetti(ctx, W, H));

  /* Stop after 5 s to save resources, fade out canvas */
  setTimeout(() => {
    confettiRunning = false;
    setTimeout(() => {
      confettiCanvas.style.transition = 'opacity 1s';
      confettiCanvas.style.opacity   = '0';
    }, 1500);
  }, 5000);
}

/** Creates a single confetti piece object. */
function newPiece(W) {
  return {
    x:       Math.random() * W,
    y:       Math.random() * -200,        // start above viewport
    w:       Math.random() * 10 + 5,      // 5–15 px wide
    h:       Math.random() * 6 + 4,       // 4–10 px tall
    color:   CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    speedY:  Math.random() * 4 + 2,       // fall speed
    speedX:  (Math.random() - 0.5) * 2.5, // horizontal drift
    angle:   Math.random() * Math.PI * 2,  // initial rotation
    spin:    (Math.random() - 0.5) * 0.2,  // rotation speed
    shape:   Math.random() > 0.5 ? 'rect' : 'circle'
  };
}

/** Draws and advances all confetti pieces each frame. */
function tickConfetti(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);

  confettiPieces.forEach((p) => {
    /* Move */
    p.y     += p.speedY;
    p.x     += p.speedX;
    p.angle += p.spin;

    /* Wrap horizontally */
    if (p.x > W + 20)  p.x = -20;
    if (p.x < -20)     p.x = W + 20;

    /* Reset when off bottom (while confetti is running) */
    if (p.y > H + 20 && confettiRunning) {
      p.y = -20;
      p.x = Math.random() * W;
    }

    /* Draw */
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = p.color;

    if (p.shape === 'rect') {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });

  /* Keep looping while pieces are still visible */
  const stillVisible = confettiPieces.some(p => p.y < H + 20);
  if (confettiRunning || stillVisible) {
    animFrameId = requestAnimationFrame(() => tickConfetti(ctx, W, H));
  }
}

/* Resize confetti canvas with the window */
window.addEventListener('resize', () => {
  if (confettiCanvas.style.opacity === '0') return;
  confettiCanvas.width  = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
});


/* =====================================================
   4. BALLOONS
   ===================================================== */

/** Balloon color options — purple/gold theme */
const BALLOON_COLORS = [
  ['#7b2ff7', '#5b1cc0'],   // deep purple
  ['#c084fc', '#a855f7'],   // lavender
  ['#f5c842', '#f59e0b'],   // gold
  ['#e879f9', '#c026d3'],   // magenta
  ['#fde68a', '#f5c842'],   // pale gold
  ['#f0abfc', '#d946ef'],   // pink-purple
];

/**
 * Spawn several balloons that float from the bottom
 * to the top of the screen with staggered timing.
 */
function launchBalloons() {
  const count = 14;   /* total balloons */

  for (let i = 0; i < count; i++) {
    /* Stagger each balloon by 200 ms */
    setTimeout(() => spawnBalloon(i, count), i * 200);
  }
}

function spawnBalloon(index, total) {
  const balloon   = document.createElement('div');
  balloon.className = 'balloon';

  /* Random position across the width */
  const leftPct   = (index / total) * 90 + Math.random() * 8;
  const colors    = BALLOON_COLORS[index % BALLOON_COLORS.length];
  const floatDur  = (Math.random() * 3 + 4).toFixed(2);   /* 4–7 s  */
  const floatDelay = (Math.random() * 0.5).toFixed(2);     /* 0–0.5s */
  const size       = Math.random() * 20 + 55;              /* 55–75px */

  balloon.style.cssText = `
    left: ${leftPct}%;
    width: ${size}px;
    height: ${size * 1.25}px;
    background: linear-gradient(135deg, ${colors[0]}, ${colors[1]});
    --float-dur:   ${floatDur}s;
    --float-delay: ${floatDelay}s;
  `;

  balloonsContainer.appendChild(balloon);

  /* Remove element after animation ends to keep DOM clean */
  balloon.addEventListener('animationend', () => balloon.remove());
}


/* =====================================================
   5. PHOTO GALLERY LIGHTBOX
   ===================================================== */

/** Wire up every gallery image to open the lightbox. */
document.querySelectorAll('.gallery-item').forEach((item) => {
  const img     = item.querySelector('img');
  const caption = item.querySelector('figcaption');

  item.addEventListener('click', () => openLightbox(img.src, img.alt, caption?.textContent ?? ''));

  /* Keyboard accessibility */
  item.setAttribute('tabindex', '0');
  item.setAttribute('role', 'button');
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(img.src, img.alt, caption?.textContent ?? '');
    }
  });
});

function openLightbox(src, alt, caption) {
  lightboxImg.src           = src;
  lightboxImg.alt           = alt;
  lightboxCaption.textContent = caption;
  lightbox.hidden           = false;
  lightbox.focus();
  document.body.style.overflow = 'hidden';   /* prevent background scroll */
}

function closeLightbox() {
  lightbox.hidden            = true;
  lightboxImg.src            = '';
  document.body.style.overflow = '';
}

lightboxClose.addEventListener('click', closeLightbox);

/* Close on backdrop click */
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

/* Close on Escape */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
});


/* =====================================================
   6. MUSIC PLAYER
   ===================================================== */

playMusicBtn.addEventListener('click', toggleMusic);

function toggleMusic() {
  if (isPlaying) {
    pauseMusic();
  } else {
    playMusic();
  }
}

function playMusic() {
  birthdayAudio.play()
    .then(() => {
      isPlaying = true;
      updateMusicUI(true);
    })
    .catch((err) => {
      /* Autoplay blocked — common on mobile; user interaction should suffice */
      console.warn('Audio playback error:', err);
    });
}

function pauseMusic() {
  birthdayAudio.pause();
  isPlaying = false;
  updateMusicUI(false);
}

/** Sync button label and equalizer state. */
function updateMusicUI(playing) {
  const icon  = playMusicBtn.querySelector('.btn-icon');
  const label = playMusicBtn.querySelector('.btn-label');

  if (playing) {
    icon.textContent  = '⏸';
    label.textContent = 'Pause Music';
    equalizer.classList.add('playing');
    playMusicBtn.setAttribute('aria-label', 'Pause birthday music');
  } else {
    icon.textContent  = '▶';
    label.textContent = 'Play Music';
    equalizer.classList.remove('playing');
    playMusicBtn.setAttribute('aria-label', 'Play birthday music');
  }
}

/* When audio ends, reset UI */
birthdayAudio.addEventListener('ended', () => {
  isPlaying = false;
  updateMusicUI(false);
});


/* =====================================================
   7. SCROLL-REVEAL (Intersection Observer)
   Fade in gallery + music section as user scrolls
   ===================================================== */
(function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.gallery-section, .music-section, .message-card'
  );

  /* Only animate elements that haven't been CSS-animated yet */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity   = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach(el => observer.observe(el));
})();


/* =====================================================
   8. MISC UTILITIES
   ===================================================== */

/**
 * Throttle helper — useful for resize listeners.
 * Not wired to anything yet, available for extension.
 */
function throttle(fn, wait) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    }
  };
}
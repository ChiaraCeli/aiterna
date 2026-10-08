<template>
  <main class="crossroads">
    <header class="crossroads__header">
      <span class="crossroads__brand">AIterna</span>

      <p class="crossroads__question">
        {{ $t("home.question") }}
      </p>
    </header>

    <div class="crossroads__road" aria-hidden="true">
      <svg
        viewBox="0 0 300 420"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="roadGlow" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#657dcc" stop-opacity="0.2" />
            <stop offset="55%" stop-color="#8b72cf" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#8b72cf" stop-opacity="0" />
          </linearGradient>
        </defs>

        <path
          d="
    M 185 420

    C 245 365, 262 310, 228 250
    C 188 180, 40 220, 42 148
    C 44 98, 120 72, 146 36
    C 155 22, 153 10, 150 0

    L 146 0

    C 146 12, 145 24, 135 39
    C 107 76, 25 96, 30 151
    C 37 232, 176 195, 215 256
    C 250 313, 228 370, 152 420

    Z
  "
          fill="url(#roadGlow)"
        />
      </svg>
    </div>

    <nav class="crossroads__paths" aria-label="Main paths">
      <RouterLink
        :to="{ name: 'stories' }"
        class="path-sign path-sign--stories"
      >
        <span class="path-sign__direction">←</span>

        <span class="path-sign__content">
          <strong>{{ $t("home.stories") }}</strong>
          <small>{{ $t("home.storiesDescription") }}</small>
        </span>
      </RouterLink>

      <RouterLink
        :to="{ name: 'explore' }"
        class="path-sign path-sign--explore"
      >
        <span class="path-sign__content">
          <strong>{{ $t("home.explore") }}</strong>
          <small>{{ $t("home.exploreDescription") }}</small>
        </span>

        <span class="path-sign__direction">→</span>
      </RouterLink>
    </nav>

    <div class="crossroads__ground" aria-hidden="true">
      <span class="crossroads__star crossroads__star--one">✦</span>
      <span class="crossroads__star crossroads__star--two">·</span>
      <span class="crossroads__star crossroads__star--three">✧</span>
      <span class="crossroads__star crossroads__star--four">✦</span>
      <span class="crossroads__star crossroads__star--five">·</span>
      <span class="crossroads__star crossroads__star--six">✧</span>
      <span class="crossroads__star crossroads__star--seven">·</span>
      <span class="crossroads__star crossroads__star--eight">✦</span>
    </div>
  </main>
</template>

<style scoped>
.crossroads {
  position: relative;

  display: flex;
  flex-direction: column;
  align-items: center;

  min-height: 100vh;
  padding: 4rem var(--space-lg) 0;

  overflow: hidden;
}

.crossroads::before {
  content: "";

  position: absolute;
  top: 35%;
  left: 50%;

  width: 500px;
  height: 500px;

  background: radial-gradient(
    circle,
    rgba(101, 125, 204, 0.09),
    rgba(139, 114, 207, 0.04) 40%,
    transparent 70%
  );

  transform: translate(-50%, -50%);
  pointer-events: none;
}

.crossroads__header {
  position: relative;
  z-index: 2;

  text-align: center;

  animation: appear 700ms ease both;
}

.crossroads__brand {
  font-family: var(--font-reading);
  font-size: 1.35rem;
  letter-spacing: 0.08em;
}

.crossroads__question {
  margin: var(--space-md) 0 0;

  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.crossroads__paths {
  position: relative;
  z-index: 2;

  width: min(100%, 430px);
  height: 390px;

  margin-top: clamp(4rem, 10vh, 6rem);
}

.crossroads__road {
  position: absolute;
  inset: 14% 0 0;

  z-index: 0;

  pointer-events: none;
}

.crossroads__road svg {
  display: block;

  width: 100%;
  height: 100%;

  overflow: visible;

  filter: drop-shadow(0 0 10px rgba(139, 114, 207, 0.14));
}

.path-sign {
  position: relative;

  display: flex;
  align-items: center;
  gap: var(--space-md);

  width: 82%;
  min-height: 76px;
  padding: var(--space-md) var(--space-lg);

  border: 1px solid rgba(139, 114, 207, 0.24);
  border-radius: 10px;

  background: rgba(16, 16, 28, 0.82);

  text-decoration: none;

  transition:
    transform var(--transition-normal),
    border-color var(--transition-normal),
    background-color var(--transition-normal),
    box-shadow var(--transition-normal);

  animation: appear 700ms ease both;
}

.path-sign--stories {
  position: absolute;

  top: 135px;
  left: 0;

  width: 76%;

  transform: rotate(-2deg);
  transform-origin: right center;

  animation:
    appear 700ms ease 120ms both,
    float-stories 5.5s ease-in-out 900ms infinite;
}

.path-sign--explore {
  position: absolute;

  top: 290px;
  right: 0;

  width: 76%;

  transform: rotate(2deg);
  transform-origin: left center;

  animation:
    appear 700ms ease 220ms both,
    float-explore 6.5s ease-in-out 1.2s infinite;
}

.path-sign:hover {
  border-color: rgba(139, 114, 207, 0.6);

  background: rgba(24, 21, 42, 0.92);

  box-shadow: 0 0 30px rgba(101, 125, 204, 0.08);
}

.path-sign--stories:hover {
  border-color: rgba(139, 114, 207, 0.6);
  background: rgba(24, 21, 42, 0.92);
  box-shadow: 0 0 30px rgba(101, 125, 204, 0.08);
}

.path-sign--explore:hover {
  border-color: rgba(139, 114, 207, 0.6);
  background: rgba(24, 21, 42, 0.92);
  box-shadow: 0 0 30px rgba(101, 125, 204, 0.08);
}

.path-sign__direction {
  flex: 0 0 auto;

  color: var(--color-accent-purple);
  font-size: 1.3rem;
}

.path-sign__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.15rem;
}

.path-sign__content strong {
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.path-sign__content small {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.path-sign--explore .path-sign__content {
  text-align: right;
}

.crossroads__ground {
  position: absolute;
  right: 0;
  bottom: 7%;
  left: 0;

  height: 80px;

  pointer-events: none;
}

.crossroads__star {
  position: absolute;

  color: var(--color-accent-purple);

  opacity: 0.45;
}

.crossroads__star--one {
  left: 19%;
  bottom: 18%;

  font-size: 0.65rem;
}

.crossroads__star--two {
  right: 23%;
  bottom: 55%;

  font-size: 1rem;
}

.crossroads__star--three {
  right: 13%;
  bottom: 10%;

  color: var(--color-accent-blue);
  font-size: 0.55rem;
}

.crossroads__star--four {
  left: 8%;
  bottom: 78%;
  font-size: 0.45rem;
}

.crossroads__star--five {
  left: 36%;
  bottom: 38%;
  font-size: 0.85rem;
  color: var(--color-accent-blue);
}

.crossroads__star--six {
  right: 35%;
  bottom: 82%;
  font-size: 0.5rem;
}

.crossroads__star--seven {
  right: 8%;
  bottom: 42%;
  font-size: 0.8rem;
  color: var(--color-accent-blue);
}

.crossroads__star--eight {
  right: 47%;
  bottom: 8%;
  font-size: 0.45rem;
}

@keyframes appear {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@media (min-width: 768px) {
  .crossroads {
    padding-top: 5rem;
  }

  .crossroads__paths {
    width: 500px;
  }
}
/*

@media (prefers-reduced-motion: reduce) {
  .path-sign--stories,
  .path-sign--explore,
  .crossroads__header {
    animation: none;
  }
}*/

@keyframes float-stories {
  0%,
  100% {
    translate: 0 0;
  }

  50% {
    translate: 0 -10px;
  }
}

@keyframes float-explore {
  0%,
  100% {
    translate: 0 0;
  }

  50% {
    translate: 0 -12px;
  }
}
</style>

/* ============================================================
   E.ON Next AI Roadshow — Presentation slideshow
   Auto-advancing, looping, keyboard-controllable ambient deck.
   ============================================================ */

// Stall content lifted from the roadshow poster deck.
const STALLS = [
    {
        n: 1, name: 'Cyber Safe AI', color: 'orange', watermark: '01',
        topics: ['Safe Prompting', 'Hallucinations'],
        activities: [
            { icon: '🛡️', title: 'Prompt Patrol', desc: 'Identify valid vs. invalid AI prompts!' },
            { icon: '🚨', title: 'Reality Check', desc: 'Hit the buzzer when the AI hallucinates!' },
        ],
    },
    {
        n: 2, name: 'Google GenAI', color: 'purple', watermark: '02',
        topics: ['Gems', 'NotebookLM'],
        activities: [
            { icon: '🔍', title: 'Notebook Detective', desc: 'Crack the case using data & insights!' },
            { icon: '💎', title: 'Gem-age Control', desc: 'Can you minimize the complaint value?' },
        ],
    },
    {
        n: 3, name: 'AI at Next', color: 'orange', watermark: '03',
        topics: ['Magic Ink', 'clAIre / dAIvid'],
        activities: [
            { icon: '✍️', title: 'Just Mink about it', desc: 'Craft the perfect response using fewer words!' },
            { icon: '🔊', title: 'Clairify', desc: 'Test your ears against synthetic voices!' },
        ],
    },
    {
        n: 4, name: 'Horizon AI', color: 'purple', watermark: '04',
        topics: ['Myths & Reality', 'The Future of AI'],
        activities: [
            { icon: '📰', title: 'Real vs No Real [Stories]', desc: 'Can you spot the fake headlines?' },
            { icon: '🖼️', title: 'Real vs No Real [Media]', desc: 'Spot the telltale signs of AI imagery!' },
        ],
    },
];

// ---- Slide builders (return HTML strings) ----
function heroSlide() {
    return `<section class="slide hero">
        <div class="summer reveal-up">Summer '26</div>
        <h1 class="reveal-up" style="animation-delay:.1s">AI<br><span class="orange">Roadshow</span></h1>
        <div class="lead reveal-up" style="animation-delay:.3s">Welcome to the Circuit</div>
        <div class="sub reveal-up" style="animation-delay:.45s">Explore the future of energy, technology, and AI. Step inside to meet the tools of tomorrow.</div>
    </section>`;
}

function overviewSlide() {
    const rows = STALLS.map((s, i) => `
        <div class="stall-row ${s.color} reveal-up" style="animation-delay:${0.15 + i * 0.12}s">
            <span class="num">${s.n}</span><span>${s.name}</span>
        </div>`).join('');
    return `<section class="slide overview">
        <div class="kicker reveal-up">4 stalls on the circuit</div>
        <h2 class="reveal-up" style="animation-delay:.08s">Take on all four</h2>
        <div class="stall-list">${rows}</div>
    </section>`;
}

function stallSlide(s) {
    const topics = s.topics.map(t => `<span class="pill"><span class="dot"></span>${t}</span>`).join('');
    const acts = s.activities.map(a => `
        <div class="activity">
            <span class="icon">${a.icon}</span>
            <div><div class="a-title">${a.title}</div><div class="a-desc">${a.desc}</div></div>
        </div>`).join('');
    return `<section class="slide stall ${s.color}">
        <div class="band-head">
            <div class="watermark">${s.watermark}</div>
            <div class="kicker">AI Roadshow · Summer '26</div>
            <div class="head-row">
                <span class="head-num">${s.n}</span>
                <span class="head-name">${s.name}</span>
            </div>
        </div>
        <div class="stall-body">
            <div class="section-label reveal-up">Topics</div>
            <div class="topics reveal-up" style="animation-delay:.08s">${topics}</div>
            <div class="section-label reveal-up" style="animation-delay:.14s">Activities</div>
            <div class="activities reveal-up" style="animation-delay:.2s">${acts}</div>
        </div>
    </section>`;
}

function championSlide() {
    return `<section class="slide champion">
        <div class="kicker reveal-up">Join the programme</div>
        <h2 class="reveal-up" style="animation-delay:.1s">Become an <span class="orange">AI Champion</span></h2>
        <div class="sub reveal-up" style="animation-delay:.25s">The next session starts soon — grab a team and get on the circuit.</div>
        <img class="logo reveal-up" src="eon_next_logo.png" alt="E.ON Next" style="animation-delay:.4s" onerror="this.style.display='none'">
    </section>`;
}

// ---- Assemble the deck ----
const SLIDES = [heroSlide(), overviewSlide(), ...STALLS.map(stallSlide), championSlide()];

const deck = document.getElementById('deck');
const progress = document.getElementById('progress');
deck.innerHTML = SLIDES.join('');
const slides = [...deck.querySelectorAll('.slide')];

// Progress dots
slides.forEach((_, i) => {
    const d = document.createElement('span');
    d.className = 'dot';
    d.addEventListener('click', () => go(i));
    progress.appendChild(d);
});
const dots = [...progress.children];

// Paused badge
const pausedBadge = document.createElement('div');
pausedBadge.className = 'paused-badge';
pausedBadge.textContent = '⏸ Paused';
document.body.appendChild(pausedBadge);

const HOLD_MS = 9000;
let index = 0;
let paused = false;
let timer = null;

function render() {
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('on', i === index));
}

function schedule() {
    clearTimeout(timer);
    if (!paused) timer = setTimeout(next, HOLD_MS);
}

function go(i) {
    index = (i + slides.length) % slides.length;
    render();
    schedule();
}
function next() { go(index + 1); }
function prev() { go(index - 1); }

function togglePause() {
    paused = !paused;
    pausedBadge.classList.toggle('show', paused);
    schedule();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); togglePause(); }
    else if (e.code === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.code === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); }
});

// Boot
render();
schedule();

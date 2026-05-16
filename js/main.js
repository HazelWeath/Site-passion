// =====================================================
//  MON UNIVERS — main.js
// =====================================================

// ---- Catégories (+ "tous" spéciale) ----
const CATEGORIES = {
    'tous': {
        label:    'Toutes les œuvres',
        icon:     null,
        desc:     'Une vision globale de tout ce que j\'aime',
        gradient: 'linear-gradient(135deg, #0f1117 0%, #1e2130 100%)',
        accent:   '#e8423a',
    },
    'horreur': {
        label:    'Horreur',
        icon:     null,
        desc:     'Frissons, tension et adrénaline',
        gradient: 'linear-gradient(135deg, #1a0000 0%, #2d0505 100%)',
        accent:   '#e8423a',
    },
    'jeux-video': {
        label:    'Jeux Vidéo',
        icon:     null,
        desc:     'Mondes à explorer, histoires à vivre',
        gradient: 'linear-gradient(135deg, #00111e 0%, #002d3d 100%)',
        accent:   '#3498db',
    },
    'film': {
        label:    'Films',
        icon:     null,
        desc:     'Cinéma, émotion et images qui marquent',
        gradient: 'linear-gradient(135deg, #1a1000 0%, #3d2b00 100%)',
        accent:   '#c9a84c',
    },
    'anime': {
        label:    'Anime',
        icon:     null,
        desc:     'Animation japonaise et récits épiques',
        gradient: 'linear-gradient(135deg, #1a0030 0%, #3d0066 100%)',
        accent:   '#9b59b6',
    },
    'jeux-de-societe': {
        label:    'Jeux de Société',
        icon:     null,
        desc:     'Stratégie, bluff et moments partagés',
        gradient: 'linear-gradient(135deg, #001a05 0%, #1b4020 100%)',
        accent:   '#27ae60',
    },
};

// ---- État global ----
const state = {
    view:     'home',
    category: null,
    itemId:   null,
    data:     [],
    audio:    null,
    playing:  false,
};

// ---- DOM persistant ----
const $app         = document.getElementById('app');
const $navBack     = document.getElementById('nav-back');
const $navTitle    = document.getElementById('nav-title');
const $navHome     = document.getElementById('nav-home');
const $audioBar    = document.getElementById('audio-bar');
const $audioToggle = document.getElementById('audio-toggle');
const $audioFill   = document.getElementById('audio-fill');
const $audioTime   = document.getElementById('audio-time');
const $audioName   = document.getElementById('audio-track-name');
const $audioDisc   = document.getElementById('audio-disc');
const $audioClose  = document.getElementById('audio-close');

// =====================================================
//  INIT
// =====================================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('./js/data.json');
        state.data = await res.json();
    } catch (e) {
        console.error('Impossible de charger data.json :', e);
        state.data = [];
    }
    navigate('home');
    setupAudioBar();
    setupNav();
});

// =====================================================
//  NAVIGATION
// =====================================================
function navigate(view, params = {}) {
    stopAudio();
    $app.style.opacity = '0';
    $app.style.transition = 'opacity 0.22s ease';

    setTimeout(() => {
        state.view     = view;
        state.category = params.category || null;
        state.itemId   = params.id       || null;
        updateNav();

        switch (view) {
            case 'home':    renderHome();               break;
            case 'gallery': renderGallery();            break;
            case 'detail':  renderDetail(state.itemId); break;
        }
        $app.style.opacity = '1';
    }, 220);
}

function updateNav() {
    const cat = state.category ? CATEGORIES[state.category] : null;

    if (state.view === 'home') {
        $navTitle.textContent = 'Mon Univers';
        $navBack.classList.add('hidden');
        $navHome.classList.add('hidden');   // inutile sur l'accueil
    } else if (state.view === 'gallery') {
        $navTitle.textContent = cat ? cat.label : 'Galerie';
        $navBack.classList.remove('hidden');
        $navHome.classList.remove('hidden');
    } else if (state.view === 'detail') {
        const item = state.data.find(d => d.id === state.itemId);
        $navTitle.textContent = item ? item.titre : 'Détail';
        $navBack.classList.remove('hidden');
        $navHome.classList.remove('hidden');
    }
}

function setupNav() {
    $navBack.addEventListener('click', () => {
        if (state.view === 'detail') navigate('gallery', { category: state.category });
        else navigate('home');
    });
    $navHome.addEventListener('click', () => navigate('home'));

    // Toggle thème
    const $toggle = document.getElementById('theme-toggle');
    const saved = localStorage.getItem('theme') || 'dark';
    if (saved === 'light') {
        document.documentElement.classList.add('light');
        $toggle.textContent = '☀️';
    }
    $toggle.addEventListener('click', () => {
        const isLight = document.documentElement.classList.toggle('light');
        $toggle.textContent = isLight ? '☀️' : '🌙';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

// =====================================================
//  VUE : ACCUEIL
// =====================================================
function renderHome() {
    const counts = {};
    state.data.forEach(item => {
        item.categories.forEach(c => { counts[c] = (counts[c] || 0) + 1; });
    });

    // Carte "Toutes les œuvres" en première
    const totalCount = state.data.length;
    const tousCard = buildCategoryCard('tous', totalCount);

    // Autres catégories (sauf 'tous')
    const otherCards = Object.keys(CATEGORIES)
        .filter(k => k !== 'tous' && (counts[k] || 0) > 0)
        .map(key => buildCategoryCard(key, counts[key] || 0))
        .join('');

    $app.innerHTML = `
    <div class="view">
        <section class="home-hero">
            <span class="home-eyebrow">Galerie personnelle</span>
            <h1 class="home-title">Mon<br><span>Univers</span></h1>
            <p class="home-subtitle">Œuvres & Passions</p>
            <p class="home-description">
                Bienvenue dans mon espace personnel. Ici, je partage les œuvres qui m'ont marqué :
                jeux vidéo, films, anime… Chaque élément est une invitation à découvrir ce qui me passionne.
            </p>
            <div class="home-divider"></div>
            <p class="home-categories-label">— Choisissez un univers —</p>
        </section>
        <div class="categories-grid">
            ${tousCard}
            ${otherCards}
        </div>
    </div>`;

    // Événements + animation
    $app.querySelectorAll('.category-card').forEach((card, i) => {
        const handler = () => navigate('gallery', { category: card.dataset.category });
        card.addEventListener('click', handler);
        card.addEventListener('keydown', e => { if (e.key === 'Enter') handler(); });
        card.style.animation = `fadeUp 0.45s ${0.05 + i * 0.07}s var(--ease) both`;
    });
}

function buildCategoryCard(key, count) {
    const cat = CATEGORIES[key];
    const isTous = key === 'tous';
    return `
    <div class="category-card ${isTous ? 'category-card--tous' : ''}"
         style="--cat-gradient:${cat.gradient}; --cat-accent:${cat.accent};"
         data-category="${key}" role="button" tabindex="0">
        <div class="cat-content">
            <span class="cat-count">${count} œuvre${count > 1 ? 's' : ''}</span>
            <div class="cat-name">${cat.label}</div>
            <div class="cat-desc">${cat.desc}</div>
            <span class="cat-arrow">Explorer</span>
        </div>
    </div>`;
}

// =====================================================
//  VUE : GALERIE
// =====================================================
function renderGallery() {
    const cat = CATEGORIES[state.category];
    const isTous = state.category === 'tous';

    const filtered = isTous
        ? state.data
        : state.data.filter(item => item.categories.includes(state.category));

    const cardsHTML = filtered.length === 0
        ? `<div class="empty-state">Aucune œuvre dans cette catégorie pour le moment.</div>`
        : filtered.map(item => {
            const tagsHTML = item.categories.map(c => {
                const ct = CATEGORIES[c];
                return `<span class="tag">${ct ? ct.label : c}</span>`;
            }).join('');

            return `
            <article class="item-card" data-id="${item.id}" role="button" tabindex="0">
                <div class="item-card-img-wrap">
                    <img class="item-card-img" src="${item.image}" alt="${item.titre}" loading="lazy">
                    <div class="item-card-tags">${tagsHTML}</div>
                </div>
                <div class="item-card-body">
                    <h2 class="item-card-title">${item.titre}</h2>
                    <p class="item-card-tagline">${item.tagline || item.description}</p>
                    <span class="item-card-btn">Découvrir</span>
                </div>
            </article>`;
        }).join('');

    $app.innerHTML = `
    <div class="view">
        <header class="gallery-header">
            <div class="gallery-category-tag">${cat ? cat.label : state.category}</div>
            <h1 class="gallery-title">${cat ? cat.label : state.category}</h1>
            <p class="gallery-subtitle">${filtered.length} œuvre${filtered.length > 1 ? 's' : ''}</p>
        </header>
        <div class="gallery-grid">${cardsHTML}</div>
    </div>`;

    $app.querySelectorAll('.item-card').forEach((card, i) => {
        const handler = () => navigate('detail', { id: parseInt(card.dataset.id), category: state.category });
        card.addEventListener('click', handler);
        card.addEventListener('keydown', e => { if (e.key === 'Enter') handler(); });
        card.style.animation = `fadeUp 0.4s ${0.04 + i * 0.06}s var(--ease) both`;
    });
}

// =====================================================
//  VUE : DÉTAIL
// =====================================================
function renderDetail(id) {
    const item = state.data.find(d => d.id === id);
    if (!item) { navigate('gallery', { category: state.category }); return; }

    const tagsHTML = item.categories.map(c => {
        const ct = CATEGORIES[c];
        return `<span class="detail-tag">${ct ? ct.label : c}</span>`;
    }).join('');

    const galerie   = item.galerie || [];
    const allImgs   = [item.image, ...galerie];
    const galleryHTML = allImgs.map(src =>
        `<img class="detail-gallery-img" src="${src}" alt="${item.titre}" loading="lazy">`
    ).join('');

    const note = item.note || 0;
    const starsHTML = [1,2,3,4,5].map(n =>
        `<span class="star ${n <= note ? 'active' : ''}">★</span>`
    ).join('');

    const infoRows = [];
    if (item.annee)      infoRows.push(['Année',       item.annee]);
    if (item.genre)      infoRows.push(['Genre',       item.genre]);
    if (item.studio)     infoRows.push(['Studio',      item.studio]);
    if (item.auteur)     infoRows.push(['Auteur',      item.auteur]);
    if (item.plateforme) infoRows.push(['Plateforme',  item.plateforme]);

    const infoHTML = infoRows.map(([label, val]) => `
        <div class="detail-info-row">
            <span class="detail-info-label">${label}</span>
            <span class="detail-info-value">${val}</span>
        </div>`).join('');

    $app.innerHTML = `
    <div class="view">
        <div class="detail-hero">
            <img class="detail-hero-img" src="${item.image}" alt="${item.titre}">
            <div class="detail-hero-overlay"></div>
            <div class="detail-hero-content">
                <div class="detail-tags">${tagsHTML}</div>
                <h1 class="detail-title">${item.titre}</h1>
                ${item.annee ? `<span class="detail-year">◈ ${item.annee}</span>` : ''}
            </div>
        </div>

        <div class="detail-body">
            <div class="detail-main">
                <p class="detail-section-label">Description</p>
                <div class="detail-description">
                    ${(item.description_longue || item.description)
                        .split('\n').filter(p => p.trim())
                        .map(p => `<p>${p.trim()}</p>`).join('')}
                </div>
                ${allImgs.length > 1 ? `
                <p class="detail-section-label">Galerie</p>
                <div class="detail-gallery">${galleryHTML}</div>` : ''}
            </div>

            <aside class="detail-sidebar">
                ${item.musique ? `
                <div class="detail-audio-box">
                    <span class="detail-audio-label">♪ Musique d'ambiance</span>
                    <p class="detail-audio-track">${item.musique_titre || 'Thème principal'}</p>
                    <button class="detail-audio-play" id="detail-play-btn">▶ &nbsp;Écouter l'ambiance</button>
                </div>` : ''}

                ${infoHTML ? `
                <div class="detail-info-box">
                    <p class="detail-section-label" style="margin-bottom:16px;">Infos</p>
                    ${infoHTML}
                </div>` : ''}

                ${note > 0 ? `
                <div class="detail-info-box" style="text-align:center;">
                    <p class="detail-section-label" style="justify-content:center; margin-bottom:12px;">Ma note</p>
                    <div class="detail-note">${starsHTML}</div>
                </div>` : ''}
            </aside>
        </div>
    </div>`;

    const playBtn = document.getElementById('detail-play-btn');
    if (playBtn && item.musique) {
        playBtn.addEventListener('click', () => {
            if (state.playing && state.audio) {
                stopAudio();
                playBtn.innerHTML = '▶ &nbsp;Écouter l\'ambiance';
            } else {
                playAudio(item.musique, item.musique_titre || item.titre);
                playBtn.innerHTML = '■ &nbsp;Arrêter la musique';
            }
        });
    }

    $app.querySelectorAll('.detail-gallery-img').forEach(img => {
        img.addEventListener('click', () => openLightbox(img.src));
    });
}

// =====================================================
//  AUDIO
// =====================================================
function setupAudioBar() {
    $audioToggle.addEventListener('click', () => {
        if (!state.audio) return;
        if (state.playing) {
            state.audio.pause();
            state.playing = false;
            $audioToggle.textContent = '▶';
            $audioDisc.classList.remove('spinning');
        } else {
            state.audio.play().catch(() => {});
            state.playing = true;
            $audioToggle.textContent = '⏸';
            $audioDisc.classList.add('spinning');
        }
    });

    $audioClose.addEventListener('click', () => {
        stopAudio();
        const btn = document.getElementById('detail-play-btn');
        if (btn) btn.innerHTML = '▶ &nbsp;Écouter l\'ambiance';
    });

    $audioBar.querySelector('.audio-progress-bar').addEventListener('click', e => {
        if (!state.audio || !state.audio.duration) return;
        const rect  = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        state.audio.currentTime = ratio * state.audio.duration;
    });
}

function playAudio(src, trackName) {
    stopAudio();
    const audio = new Audio(src);
    audio.loop  = true;
    state.audio = audio;

    audio.addEventListener('canplay', () => {
        audio.play().then(() => {
            state.playing = true;
            $audioToggle.textContent = '⏸';
            $audioDisc.classList.add('spinning');
            $audioBar.classList.remove('hidden');
            $audioName.textContent = trackName || '—';
        }).catch(err => console.warn('Lecture impossible :', err));
    });

    audio.addEventListener('error', () => {
        console.warn('Fichier audio introuvable :', src);
    });

    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        $audioFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
        const m = Math.floor(audio.currentTime / 60);
        const s = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
        $audioTime.textContent = `${m}:${s}`;
    });

    audio.load();
}

function stopAudio() {
    if (state.audio) { state.audio.pause(); state.audio.src = ''; state.audio = null; }
    state.playing = false;
    $audioToggle.textContent = '▶';
    $audioDisc.classList.remove('spinning');
    $audioBar.classList.add('hidden');
    $audioFill.style.width = '0%';
    $audioTime.textContent = '0:00';
}

// =====================================================
//  LIGHTBOX
// =====================================================
function openLightbox(src) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `<img src="${src}" alt="Zoom">`;
    lb.addEventListener('click', () => lb.remove());
    document.body.appendChild(lb);
}

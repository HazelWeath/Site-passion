// =====================================================
//  MON UNIVERS — main.js
//  Architecture : SPA avec 3 vues (home / gallery / detail)
// =====================================================

// ---- Définition des catégories ----
const CATEGORIES = {
    'horreur': {
        label:    'Horreur',
        icon:     '☠',
        desc:     'Frissons, tension et adrénaline',
        gradient: 'linear-gradient(135deg, #1a0000 0%, #2d0505 100%)',
        accent:   '#c0392b',
    },
    'jeux-video': {
        label:    'Jeux Vidéo',
        icon:     '◉',
        desc:     'Mondes à explorer, histoires à vivre',
        gradient: 'linear-gradient(135deg, #00111e 0%, #002d3d 100%)',
        accent:   '#2980b9',
    },
    'film': {
        label:    'Films',
        icon:     '◐',
        desc:     'Cinéma, émotion et images qui marquent',
        gradient: 'linear-gradient(135deg, #1a1000 0%, #3d2b00 100%)',
        accent:   '#c9a84c',
    },
    'anime': {
        label:    'Anime',
        icon:     '◈',
        desc:     'Animation japonaise et récits épiques',
        gradient: 'linear-gradient(135deg, #1a0030 0%, #3d0066 100%)',
        accent:   '#9b59b6',
    },
    'jeux-de-societe': {
        label:    'Jeux de Société',
        icon:     '⬡',
        desc:     'Stratégie, bluff et moments partagés',
        gradient: 'linear-gradient(135deg, #001a05 0%, #1b4020 100%)',
        accent:   '#27ae60',
    },
};

// ---- État global ----
const state = {
    view:     'home',   // 'home' | 'gallery' | 'detail'
    category: null,     // clé de catégorie active
    itemId:   null,     // id de l'élément actif
    data:     [],       // toutes les données chargées
    audio:    null,     // objet Audio actif
    playing:  false,
};

// ---- Éléments DOM persistants ----
const $app      = document.getElementById('app');
const $topnav   = document.getElementById('topnav');
const $navBack  = document.getElementById('nav-back');
const $navTitle = document.getElementById('nav-title');
const $navHome  = document.getElementById('nav-home');
const $audioBar = document.getElementById('audio-bar');
const $audioToggle  = document.getElementById('audio-toggle');
const $audioFill    = document.getElementById('audio-fill');
const $audioTime    = document.getElementById('audio-time');
const $audioName    = document.getElementById('audio-track-name');
const $audioDisc    = document.getElementById('audio-disc');
const $audioClose   = document.getElementById('audio-close');

// =====================================================
//  CHARGEMENT
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

    // Fade out puis rendu
    $app.style.opacity = '0';
    $app.style.transition = 'opacity 0.25s ease';

    setTimeout(() => {
        state.view     = view;
        state.category = params.category || null;
        state.itemId   = params.id       || null;

        updateNav();

        switch (view) {
            case 'home':    renderHome();           break;
            case 'gallery': renderGallery();        break;
            case 'detail':  renderDetail(state.itemId); break;
        }

        $app.style.opacity = '1';
    }, 250);
}

function updateNav() {
    const cat = state.category ? CATEGORIES[state.category] : null;

    switch (state.view) {
        case 'home':
            $navTitle.textContent = 'Mon Univers';
            $navBack.classList.add('hidden');
            break;
        case 'gallery':
            $navTitle.textContent = cat ? cat.label : 'Galerie';
            $navBack.classList.remove('hidden');
            break;
        case 'detail': {
            const item = state.data.find(d => d.id === state.itemId);
            $navTitle.textContent = item ? item.titre : 'Détail';
            $navBack.classList.remove('hidden');
            break;
        }
    }
}

function setupNav() {
    $navBack.addEventListener('click', () => {
        if (state.view === 'detail') navigate('gallery', { category: state.category });
        else navigate('home');
    });
    $navHome.addEventListener('click', () => navigate('home'));
}

// =====================================================
//  VUE : ACCUEIL
// =====================================================
function renderHome() {
    // Compter les items par catégorie
    const counts = {};
    state.data.forEach(item => {
        item.categories.forEach(c => { counts[c] = (counts[c] || 0) + 1; });
    });

    const catKeys = Object.keys(CATEGORIES);

    const catsHTML = catKeys.map(key => {
        const cat   = CATEGORIES[key];
        const count = counts[key] || 0;
        if (count === 0) return ''; // cacher les catégories vides

        return `
        <div class="category-card" 
             style="--cat-gradient: ${cat.gradient}; --cat-accent: ${cat.accent};"
             data-category="${key}" role="button" tabindex="0">
            <div class="cat-bg-icon">${cat.icon}</div>
            <div class="cat-content">
                <span class="cat-count">${count} œuvre${count > 1 ? 's' : ''}</span>
                <div class="cat-name">${cat.label}</div>
                <div class="cat-desc">${cat.desc}</div>
                <span class="cat-arrow">→ Explorer</span>
            </div>
        </div>`;
    }).join('');

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
        <div class="categories-grid">${catsHTML}</div>
    </div>`;

    // Événements sur les cartes catégorie
    $app.querySelectorAll('.category-card').forEach(card => {
        const handler = () => navigate('gallery', { category: card.dataset.category });
        card.addEventListener('click', handler);
        card.addEventListener('keydown', e => { if (e.key === 'Enter') handler(); });
    });

    // Animation d'entrée décalée
    $app.querySelectorAll('.category-card').forEach((card, i) => {
        card.style.animation = `viewIn 0.5s ${0.1 + i * 0.08}s var(--ease) both`;
    });
}

// =====================================================
//  VUE : GALERIE FILTRÉE
// =====================================================
function renderGallery() {
    const cat      = CATEGORIES[state.category];
    const filtered = state.data.filter(item => item.categories.includes(state.category));

    const cardsHTML = filtered.length === 0
        ? `<div class="empty-state">Aucune œuvre dans cette catégorie pour le moment.</div>`
        : filtered.map(item => {
            const tagsHTML = item.categories.map(c => {
                const cat = CATEGORIES[c];
                return `<span class="tag">${cat ? cat.label : c}</span>`;
            }).join('');

            return `
            <article class="item-card" data-id="${item.id}" role="button" tabindex="0">
                <div class="item-card-img-wrap">
                    <img class="item-card-img" src="${item.image}" alt="${item.titre}" loading="lazy">
                    <div class="item-card-overlay"></div>
                    <div class="item-card-tags">${tagsHTML}</div>
                </div>
                <div class="item-card-body">
                    <h2 class="item-card-title">${item.titre}</h2>
                    <p class="item-card-tagline">${item.tagline || item.description}</p>
                    <button class="item-card-btn">Découvrir</button>
                </div>
            </article>`;
        }).join('');

    $app.innerHTML = `
    <div class="view">
        <header class="gallery-header">
            <div class="gallery-category-tag">${cat ? cat.icon + ' ' + cat.label : state.category}</div>
            <h1 class="gallery-title">${cat ? cat.label : state.category}</h1>
            <p class="gallery-subtitle">${filtered.length} œuvre${filtered.length > 1 ? 's' : ''} dans cet univers</p>
        </header>
        <div class="gallery-grid">${cardsHTML}</div>
    </div>`;

    // Événements cartes
    $app.querySelectorAll('.item-card').forEach(card => {
        const handler = () => navigate('detail', { id: parseInt(card.dataset.id), category: state.category });
        card.addEventListener('click', handler);
        card.addEventListener('keydown', e => { if (e.key === 'Enter') handler(); });
    });

    // Animation décalée
    $app.querySelectorAll('.item-card').forEach((card, i) => {
        card.style.animation = `viewIn 0.5s ${0.05 + i * 0.07}s var(--ease) both`;
    });
}

// =====================================================
//  VUE : DÉTAIL D'UN ÉLÉMENT
// =====================================================
function renderDetail(id) {
    const item = state.data.find(d => d.id === id);
    if (!item) { navigate('gallery', { category: state.category }); return; }

    const tagsHTML = item.categories.map(c => {
        const cat = CATEGORIES[c];
        return `<span class="detail-tag">${cat ? cat.label : c}</span>`;
    }).join('');

    // Galerie d'images
    const galerie  = item.galerie || [];
    const allImgs  = [item.image, ...galerie];
    const galleryHTML = allImgs.map(src =>
        `<img class="detail-gallery-img" src="${src}" alt="${item.titre}" loading="lazy">`
    ).join('');

    // Note (étoiles)
    const note     = item.note || 0;
    const starsHTML = [1,2,3,4,5].map(n =>
        `<span class="star ${n <= note ? 'active' : ''}">★</span>`
    ).join('');

    // Infos complémentaires
    const infoRows = [];
    if (item.annee)   infoRows.push(['Année',   item.annee]);
    if (item.genre)   infoRows.push(['Genre',   item.genre]);
    if (item.studio)  infoRows.push(['Studio',  item.studio]);
    if (item.auteur)  infoRows.push(['Auteur',  item.auteur]);
    if (item.plateforme) infoRows.push(['Plateforme', item.plateforme]);

    const infoHTML = infoRows.map(([label, val]) => `
        <div class="detail-info-row">
            <span class="detail-info-label">${label}</span>
            <span class="detail-info-value">${val}</span>
        </div>`).join('');

    $app.innerHTML = `
    <div class="view">

        <!-- HERO -->
        <div class="detail-hero">
            <img class="detail-hero-img" src="${item.image}" alt="${item.titre}">
            <div class="detail-hero-overlay"></div>
            <div class="detail-hero-content">
                <div class="detail-tags">${tagsHTML}</div>
                <h1 class="detail-title">${item.titre}</h1>
                ${item.annee ? `<span class="detail-year">◈ ${item.annee}</span>` : ''}
            </div>
        </div>

        <!-- CORPS -->
        <div class="detail-body">
            <!-- Colonne principale -->
            <div class="detail-main">

                <p class="detail-section-label">Description</p>
                <div class="detail-description">
                    ${(item.description_longue || item.description)
                        .split('\n')
                        .filter(p => p.trim())
                        .map(p => `<p>${p.trim()}</p>`)
                        .join('')}
                </div>

                ${allImgs.length > 1 ? `
                <p class="detail-section-label">Galerie</p>
                <div class="detail-gallery">${galleryHTML}</div>
                ` : ''}
            </div>

            <!-- Sidebar -->
            <aside class="detail-sidebar">

                <!-- Musique d'ambiance -->
                ${item.musique ? `
                <div class="detail-audio-box">
                    <span class="detail-audio-label">♪ Musique d'ambiance</span>
                    <p class="detail-audio-track">${item.musique_titre || 'Thème principal'}</p>
                    <button class="detail-audio-play" id="detail-play-btn">
                        ▶ &nbsp; Écouter l'ambiance
                    </button>
                </div>` : ''}

                <!-- Infos -->
                ${infoHTML ? `
                <div class="detail-info-box" style="margin-top: 20px;">
                    <p class="detail-section-label" style="margin-bottom:16px;">Infos</p>
                    ${infoHTML}
                </div>` : ''}

                <!-- Note personnelle -->
                ${note > 0 ? `
                <div class="detail-info-box" style="text-align:center;">
                    <p class="detail-section-label" style="justify-content:center; margin-bottom:12px;">Ma note</p>
                    <div class="detail-note">${starsHTML}</div>
                </div>` : ''}
            </aside>
        </div>
    </div>`;

    // Bouton lecture
    const playBtn = document.getElementById('detail-play-btn');
    if (playBtn && item.musique) {
        playBtn.addEventListener('click', () => {
            if (state.playing && state.audio) {
                stopAudio();
                playBtn.textContent = '▶  Écouter l\'ambiance';
            } else {
                playAudio(item.musique, item.musique_titre || item.titre);
                playBtn.innerHTML = '■ &nbsp; Arrêter la musique';
            }
        });
    }

    // Lightbox sur les images de galerie
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
        // Remettre le bouton du détail si on est en vue détail
        const detailBtn = document.getElementById('detail-play-btn');
        if (detailBtn) detailBtn.innerHTML = '▶ &nbsp; Écouter l\'ambiance';
    });

    // Clic sur la barre de progression
    $audioBar.querySelector('.audio-progress-bar').addEventListener('click', (e) => {
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
    state.audio   = audio;
    state.playing = false;

    audio.addEventListener('canplay', () => {
        audio.play()
            .then(() => {
                state.playing = true;
                $audioToggle.textContent = '⏸';
                $audioDisc.classList.add('spinning');
                $audioBar.classList.remove('hidden');
                $audioName.textContent = trackName || '—';
            })
            .catch(err => console.warn('Lecture impossible :', err));
    });

    audio.addEventListener('error', () => {
        console.warn('Fichier audio introuvable :', src);
        $audioBar.classList.add('hidden');
    });

    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        $audioFill.style.width = pct + '%';

        const mins = Math.floor(audio.currentTime / 60);
        const secs = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
        $audioTime.textContent = `${mins}:${secs}`;
    });

    audio.load();
}

function stopAudio() {
    if (state.audio) {
        state.audio.pause();
        state.audio.src = '';
        state.audio = null;
    }
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

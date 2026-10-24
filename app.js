/* ============================================
   BOT AGENCE MAROC — Application Logic
   ============================================ */

// State
const state = {
    currentStep: 0,
    answers: {
        destination: null,
        travelers: null,
        month: null,
        duration: 7,
        experiences: [],
        budget: 1500,
        contact: { prenom: '', nom: '', email: '', tel: '', message: '' }
    }
};

// Destinations data
const destinations = [
    { id: 'marrakech', name: 'Marrakech & environs', desc: 'Médina, souks, jardins', icon: '🕌' },
    { id: 'desert', name: 'Désert & Sahara', desc: 'Dunes, bivouac, étoiles', icon: '🏜️' },
    { id: 'fes', name: 'Fès & villes impériales', desc: 'Histoire, artisanat, culture', icon: '🏛️' },
    { id: 'atlas', name: 'Atlas & montagnes', desc: 'Trek, villages berbères', icon: '⛰️' },
    { id: 'essaouira', name: 'Essaouira & côte', desc: 'Océan, surf, détente', icon: '🌊' },
    { id: 'chefchaouen', name: 'Chefchaouen & Rif', desc: 'Ville bleue, nature', icon: '💙' },
    { id: 'grand-sud', name: 'Grand Sud & oasis', desc: 'Kasbahs, palmeraies', icon: '🌴' },
    { id: 'circuit', name: 'Circuit complet', desc: 'Le meilleur du Maroc', icon: '🗺️' }
];

// Traveler types
const travelerTypes = [
    { id: 'solo', label: 'Solo', icon: '🧳' },
    { id: 'couple', label: 'En couple', icon: '💑' },
    { id: 'famille', label: 'En famille', icon: '👨‍👩‍👧‍👦' },
    { id: 'amis', label: 'Entre amis', icon: '👥' }
];

// Months
const months = [
    'Janvier', 'Février', 'Mars', 'Avril',
    'Mai', 'Juin', 'Juillet', 'Août',
    'Sept.', 'Octobre', 'Nov.', 'Décembre'
];

// Experience types
const experiences = [
    { id: 'culture', label: 'Culture & histoire', icon: '🏛️' },
    { id: 'aventure', label: 'Aventure & trek', icon: '🥾' },
    { id: 'detente', label: 'Détente & bien-être', icon: '🧖' },
    { id: 'gastronomie', label: 'Gastronomie', icon: '🍽️' },
    { id: 'nature', label: 'Nature & paysages', icon: '🌿' },
    { id: 'authentique', label: 'Hors sentiers battus', icon: '🧭' },
    { id: 'roadtrip', label: 'Road-trip', icon: '🚗' },
    { id: 'luxe', label: 'Luxe & riads', icon: '✨' },
    { id: 'famille', label: 'Adapté enfants', icon: '🎠' }
];

// Steps definition
const steps = [
    {
        id: 'destination',
        question: 'Bienvenue ! 🌙 Je suis votre assistant BOT AGENCE MAROC. Quelle région du Maroc vous fait rêver ?',
        type: 'destination'
    },
    {
        id: 'travelers',
        question: 'Excellent choix ! Et avec qui partez-vous dans cette aventure ?',
        type: 'travelers'
    },
    {
        id: 'dates',
        question: 'Quand souhaitez-vous partir ? Choisissez votre mois idéal :',
        type: 'dates'
    },
    {
        id: 'duration',
        question: 'Combien de jours souhaitez-vous passer au Maroc ?',
        type: 'duration'
    },
    {
        id: 'experiences',
        question: 'Quel type d\'expériences vous attire ? Sélectionnez tout ce qui vous parle ! 🎯',
        type: 'experiences'
    },
    {
        id: 'budget',
        question: 'Quel est votre budget approximatif par personne ? (hors vol international)',
        type: 'budget'
    },
    {
        id: 'contact',
        question: 'Parfait ! 🎉 Pour recevoir votre proposition personnalisée, laissez-moi vos coordonnées :',
        type: 'contact'
    }
];

// DOM refs
const chatBody = document.getElementById('chatBody');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const btnBack = document.getElementById('btnBack');

// ============================================
// Navigation
// ============================================

function startJourney() {
    document.getElementById('landing').classList.remove('active');
    document.getElementById('chatWidget').classList.add('active');
    setTimeout(() => showStep(0), 300);
}

function showStep(stepIndex) {
    state.currentStep = stepIndex;
    updateProgress();
    btnBack.style.display = stepIndex > 0 ? 'block' : 'none';

    const step = steps[stepIndex];

    // Show typing indicator
    addTypingIndicator();

    setTimeout(() => {
        removeTypingIndicator();
        addBotMessage(step.question);

        setTimeout(() => {
            renderStepUI(step);
            scrollToBottom();
        }, 200);
    }, 800 + Math.random() * 400);
}

function goBack() {
    if (state.currentStep > 0) {
        chatBody.innerHTML = '';
        showStep(state.currentStep - 1);
    }
}

function nextStep() {
    const current = state.currentStep;
    if (current < steps.length - 1) {
        // Show user's answer as a message
        showUserAnswer(current);

        setTimeout(() => {
            showStep(current + 1);
        }, 500);
    }
}

function updateProgress() {
    const total = steps.length;
    const pct = ((state.currentStep + 1) / total) * 100;
    progressFill.style.width = pct + '%';
    progressText.textContent = `Étape ${state.currentStep + 1} sur ${total}`;
}

// ============================================
// Messages
// ============================================

function addBotMessage(text) {
    const div = document.createElement('div');
    div.className = 'message message-bot';
    div.innerHTML = `<div class="bubble bubble-bot">${text}</div>`;
    chatBody.appendChild(div);
    scrollToBottom();
}

function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'message message-user';
    div.innerHTML = `<div class="bubble bubble-user">${text}</div>`;
    chatBody.appendChild(div);
    scrollToBottom();
}

function addTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'message message-bot';
    div.id = 'typingIndicator';
    div.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    chatBody.appendChild(div);
    scrollToBottom();
}

function removeTypingIndicator() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        chatBody.scrollTop = chatBody.scrollHeight;
    });
}

function showUserAnswer(stepIndex) {
    const step = steps[stepIndex];
    let text = '';

    switch (step.id) {
        case 'destination':
            const dest = destinations.find(d => d.id === state.answers.destination);
            text = dest ? `${dest.icon} ${dest.name}` : '';
            break;
        case 'travelers':
            const trav = travelerTypes.find(t => t.id === state.answers.travelers);
            text = trav ? `${trav.icon} ${trav.label}` : '';
            break;
        case 'dates':
            text = `📅 ${months[state.answers.month]}`;
            break;
        case 'duration':
            text = `⏱️ ${state.answers.duration} jours`;
            break;
        case 'experiences':
            const exps = state.answers.experiences.map(id => {
                const exp = experiences.find(e => e.id === id);
                return exp ? exp.icon + ' ' + exp.label : '';
            });
            text = exps.join(', ');
            break;
        case 'budget':
            text = `💰 ${state.answers.budget} € / personne`;
            break;
    }

    if (text) addUserMessage(text);
}

// ============================================
// Step UI Renderers
// ============================================

function renderStepUI(step) {
    const container = document.createElement('div');
    container.className = 'step-ui';

    switch (step.type) {
        case 'destination':
            container.innerHTML = renderDestinations();
            break;
        case 'travelers':
            container.innerHTML = renderTravelers();
            break;
        case 'dates':
            container.innerHTML = renderDates();
            break;
        case 'duration':
            container.innerHTML = renderDuration();
            break;
        case 'experiences':
            container.innerHTML = renderExperiences();
            break;
        case 'budget':
            container.innerHTML = renderBudget();
            break;
        case 'contact':
            container.innerHTML = renderContactForm();
            break;
    }

    chatBody.appendChild(container);
    scrollToBottom();

    // Attach event listeners
    attachStepListeners(step.type);
}

function renderDestinations() {
    let html = '<div class="options-grid" style="grid-template-columns:1fr;">';
    destinations.forEach(dest => {
        html += `
            <div class="destination-card" data-id="${dest.id}" onclick="selectDestination('${dest.id}')">
                <div class="dest-icon">${dest.icon}</div>
                <div class="dest-info">
                    <h4>${dest.name}</h4>
                    <p>${dest.desc}</p>
                </div>
            </div>
        `;
    });
    html += '</div>';
    html += `<button class="btn-next" id="btnNextDest" disabled onclick="nextStep()">Continuer →</button>`;
    return html;
}

function selectDestination(id) {
    state.answers.destination = id;
    document.querySelectorAll('.destination-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`.destination-card[data-id="${id}"]`).classList.add('selected');
    document.getElementById('btnNextDest').disabled = false;
}

function renderTravelers() {
    let html = '<div class="options-grid grid-2">';
    travelerTypes.forEach(t => {
        html += `
            <div class="option-card" data-id="${t.id}" onclick="selectTraveler('${t.id}')">
                <span class="icon">${t.icon}</span>
                <span class="label">${t.label}</span>
            </div>
        `;
    });
    html += '</div>';
    html += `<button class="btn-next" id="btnNextTrav" disabled onclick="nextStep()">Continuer →</button>`;
    return html;
}

function selectTraveler(id) {
    state.answers.travelers = id;
    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`.option-card[data-id="${id}"]`).classList.add('selected');
    document.getElementById('btnNextTrav').disabled = false;
}

function renderDates() {
    let html = '<div class="date-grid">';
    months.forEach((m, i) => {
        html += `<button class="date-btn" data-month="${i}" onclick="selectMonth(${i})">${m}</button>`;
    });
    html += '</div>';
    html += `<button class="btn-next" id="btnNextDate" disabled onclick="nextStep()">Continuer →</button>`;
    return html;
}

function selectMonth(index) {
    state.answers.month = index;
    document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector(`.date-btn[data-month="${index}"]`).classList.add('selected');
    document.getElementById('btnNextDate').disabled = false;
}

function renderDuration() {
    return `
        <div class="duration-selector">
            <button class="duration-btn" onclick="changeDuration(-1)">−</button>
            <div class="duration-value">
                <span id="durationVal">${state.answers.duration}</span>
                <span class="unit">jours</span>
            </div>
            <button class="duration-btn" onclick="changeDuration(1)">+</button>
        </div>
        <button class="btn-next" onclick="nextStep()">Continuer →</button>
    `;
}

function changeDuration(delta) {
    state.answers.duration = Math.max(3, Math.min(30, state.answers.duration + delta));
    document.getElementById('durationVal').textContent = state.answers.duration;
}

function renderExperiences() {
    let html = '<div class="options-grid grid-3">';
    experiences.forEach(e => {
        html += `
            <div class="option-card" data-id="${e.id}" onclick="toggleExperience('${e.id}')">
                <span class="icon">${e.icon}</span>
                <span class="label">${e.label}</span>
            </div>
        `;
    });
    html += '</div>';
    html += `<button class="btn-next" id="btnNextExp" disabled onclick="nextStep()">Continuer →</button>`;
    return html;
}

function toggleExperience(id) {
    const idx = state.answers.experiences.indexOf(id);
    if (idx > -1) {
        state.answers.experiences.splice(idx, 1);
    } else {
        state.answers.experiences.push(id);
    }
    document.querySelector(`.option-card[data-id="${id}"]`).classList.toggle('selected');
    document.getElementById('btnNextExp').disabled = state.answers.experiences.length === 0;
}

function renderBudget() {
    return `
        <div class="slider-container">
            <div class="slider-value">
                <span id="budgetVal">${state.answers.budget}</span> <span class="currency">€ / pers.</span>
            </div>
            <input type="range" min="300" max="5000" step="100" value="${state.answers.budget}" 
                   oninput="updateBudget(this.value)">
            <div class="slider-labels">
                <span>300 €</span>
                <span>Économique</span>
                <span>Confort</span>
                <span>Luxe</span>
                <span>5000 €</span>
            </div>
        </div>
        <button class="btn-next" onclick="nextStep()">Continuer →</button>
    `;
}

function updateBudget(val) {
    state.answers.budget = parseInt(val);
    document.getElementById('budgetVal').textContent = val;
}

function renderContactForm() {
    return `
        <div class="contact-form">
            <div class="form-group">
                <input type="text" id="fPrenom" placeholder="Prénom *" required>
            </div>
            <div class="form-group">
                <input type="text" id="fNom" placeholder="Nom *" required>
            </div>
            <div class="form-group">
                <input type="email" id="fEmail" placeholder="E-mail *" required>
            </div>
            <div class="form-group">
                <input type="tel" id="fTel" placeholder="Téléphone">
            </div>
            <div class="form-group">
                <textarea id="fMessage" placeholder="Un message, des envies particulières ? (optionnel)"></textarea>
            </div>
            <button class="btn-next btn-submit" onclick="submitForm()">
                Envoyer ma demande 🚀
            </button>
            <p style="text-align:center; font-size:0.72rem; color:var(--gray-400); margin-top:0.5rem;">
                ✓ Gratuit · Sans engagement · Réponse sous 48h
            </p>
        </div>
    `;
}

function submitForm() {
    const prenom = document.getElementById('fPrenom').value.trim();
    const nom = document.getElementById('fNom').value.trim();
    const email = document.getElementById('fEmail').value.trim();
    const tel = document.getElementById('fTel').value.trim();
    const message = document.getElementById('fMessage').value.trim();

    if (!prenom || !nom || !email) {
        alert('Veuillez remplir au moins le prénom, le nom et l\'e-mail.');
        return;
    }

    if (!email.includes('@') || !email.includes('.')) {
        alert('Veuillez entrer un e-mail valide.');
        return;
    }

    state.answers.contact = { prenom, nom, email, tel, message };

    // Show confirmation
    showConfirmation();
}

function showConfirmation() {
    document.getElementById('chatWidget').classList.remove('active');
    document.getElementById('confirmation').classList.add('active');

    const dest = destinations.find(d => d.id === state.answers.destination);
    const trav = travelerTypes.find(t => t.id === state.answers.travelers);
    const expLabels = state.answers.experiences.map(id => {
        const e = experiences.find(exp => exp.id === id);
        return e ? e.label : '';
    }).join(', ');

    document.getElementById('summaryCard').innerHTML = `
        <h4>🌙 Récapitulatif de votre demande</h4>
        <div class="summary-item">
            <span class="label">Destination</span>
            <span class="value">${dest ? dest.icon + ' ' + dest.name : '—'}</span>
        </div>
        <div class="summary-item">
            <span class="label">Voyageurs</span>
            <span class="value">${trav ? trav.icon + ' ' + trav.label : '—'}</span>
        </div>
        <div class="summary-item">
            <span class="label">Période</span>
            <span class="value">📅 ${months[state.answers.month] || '—'}</span>
        </div>
        <div class="summary-item">
            <span class="label">Durée</span>
            <span class="value">⏱️ ${state.answers.duration} jours</span>
        </div>
        <div class="summary-item">
            <span class="label">Expériences</span>
            <span class="value">${expLabels || '—'}</span>
        </div>
        <div class="summary-item">
            <span class="label">Budget</span>
            <span class="value">💰 ${state.answers.budget} € / pers.</span>
        </div>
        <div class="summary-item">
            <span class="label">Contact</span>
            <span class="value">${state.answers.contact.prenom} ${state.answers.contact.nom}<br>${state.answers.contact.email}</span>
        </div>
    `;
}

function resetAll() {
    state.currentStep = 0;
    state.answers = {
        destination: null,
        travelers: null,
        month: null,
        duration: 7,
        experiences: [],
        budget: 1500,
        contact: { prenom: '', nom: '', email: '', tel: '', message: '' }
    };
    chatBody.innerHTML = '';
    document.getElementById('confirmation').classList.remove('active');
    document.getElementById('landing').classList.add('active');
}

function attachStepListeners(type) {
    // Keyboard support for text inputs
    if (type === 'contact') {
        const inputs = document.querySelectorAll('.contact-form input');
        inputs.forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const next = input.parentElement.nextElementSibling;
                    if (next && next.querySelector('input')) {
                        next.querySelector('input').focus();
                    } else {
                        submitForm();
                    }
                }
            });
        });
    }
}

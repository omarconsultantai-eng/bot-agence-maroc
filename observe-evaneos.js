/**
 * REA Browser Observation — Evaneos "Créer mon voyage" widget
 * v2 — Fixed: use domcontentloaded, handle cookie consent, explore widget
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

async function run() {
    if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

    console.log('=== REA Browser Observation v2: Evaneos Widget ===\n');

    const browser = await chromium.launch({ headless: true, args: ['--lang=fr-FR'] });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        locale: 'fr-FR',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    let stepNum = 0;

    async function snap(name, desc) {
        stepNum++;
        const fn = `step_${String(stepNum).padStart(2, '0')}_${name}.png`;
        const fp = path.join(SCREENSHOTS_DIR, fn);
        await page.screenshot({ path: fp, fullPage: false });
        console.log(`📸 [${stepNum}] ${desc} → ${fn}\n`);
        return fp;
    }

    async function analyze(desc) {
        console.log(`🔍 ${desc}`);
        const a = await page.evaluate(() => {
            const txt = (el) => el.textContent.trim().substring(0, 120);
            const vis = (el) => el.offsetParent !== null || el.offsetWidth > 0;
            return {
                url: location.href,
                title: document.title,
                h1: [...document.querySelectorAll('h1')].filter(vis).map(txt),
                h2: [...document.querySelectorAll('h2')].filter(vis).map(txt),
                h3: [...document.querySelectorAll('h3')].filter(vis).map(txt).slice(0, 8),
                buttons: [...document.querySelectorAll('button, [role="button"], a[class*="btn"], a[class*="cta"]')]
                    .filter(el => vis(el) && txt(el).length > 0)
                    .map(el => ({ text: txt(el), tag: el.tagName })).slice(0, 25),
                inputs: [...document.querySelectorAll('input:not([type="hidden"]), select, textarea, [role="slider"], [role="radio"], [role="checkbox"], [role="combobox"]')]
                    .filter(vis)
                    .map(el => ({ type: el.type || el.getAttribute('role') || el.tagName.toLowerCase(), placeholder: el.placeholder || '', name: el.name || '' })).slice(0, 15),
                links: [...document.querySelectorAll('a')]
                    .filter(el => vis(el) && txt(el).length > 2 && txt(el).length < 80)
                    .map(el => ({ text: txt(el), href: el.href })).slice(0, 30),
                forms: document.querySelectorAll('form').length,
                modals: document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="overlay"], [class*="popup"]').length,
            };
        });
        console.log(`   URL: ${a.url}`);
        if (a.h1.length) console.log(`   H1: ${a.h1.join(' | ')}`);
        if (a.h2.length) console.log(`   H2: ${a.h2.join(' | ')}`);
        if (a.buttons.length) {
            console.log(`   Boutons (${a.buttons.length}):`);
            a.buttons.slice(0, 15).forEach(b => console.log(`     • [${b.tag}] "${b.text}"`));
        }
        if (a.inputs.length) {
            console.log(`   Champs (${a.inputs.length}):`);
            a.inputs.forEach(i => console.log(`     • [${i.type}] placeholder="${i.placeholder}" name="${i.name}"`));
        }
        if (a.links.length > 0) {
            console.log(`   Liens (${a.links.length}):`);
            a.links.slice(0, 15).forEach(l => console.log(`     → "${l.text}" ${l.href}`));
        }
        console.log('');
        return a;
    }

    async function clickFirst(selectors, label) {
        for (const sel of selectors) {
            try {
                const el = await page.$(sel);
                if (el && await el.isVisible()) {
                    const t = (await el.textContent()).trim().substring(0, 60);
                    console.log(`✓ ${label}: "${t}" (${sel})`);
                    await el.click();
                    return true;
                }
            } catch (e) {}
        }
        return false;
    }

    try {
        // ── PHASE 1: Landing ──
        console.log('━━━ PHASE 1: Page d\'accueil Evaneos ━━━\n');
        await page.goto('https://www.evaneos.fr/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(5000); // let JS render
        await snap('landing_raw', 'Page d\'accueil — chargement initial (avec cookie banner)');

        // Handle cookie consent
        const cookieClicked = await clickFirst([
            'button:has-text("Accepter & Fermer")',
            'button:has-text("Accepter")',
            'button:has-text("Tout accepter")',
            'button:has-text("Accept")',
            ':text("Continuer sans accepter")'
        ], 'Cookie consent');

        if (cookieClicked) {
            await page.waitForTimeout(2000);
        }

        await snap('landing_clean', 'Page d\'accueil — après cookie consent');
        const landing = await analyze('Page d\'accueil Evaneos');

        // ── PHASE 2: Navigate to destination Maroc ──
        console.log('━━━ PHASE 2: Navigation vers une destination ━━━\n');

        // Try clicking on Maroc or a specific destination
        let foundDest = await clickFirst([
            'a:has-text("Maroc")',
            'a[href*="maroc"]',
        ], 'Lien destination');

        if (!foundDest) {
            // Try the Destinations menu
            await clickFirst([
                'text="Destinations"',
                '[class*="nav"] :text("Destinations")',
            ], 'Menu Destinations');
            await page.waitForTimeout(2000);
            await snap('destinations_menu', 'Menu Destinations ouvert');
            await analyze('Menu Destinations');

            foundDest = await clickFirst([
                'a:has-text("Maroc")',
                'a[href*="maroc"]',
                'a:has-text("Afrique")',
            ], 'Lien Maroc dans le menu');
        }

        if (foundDest) {
            await page.waitForTimeout(4000);
            await snap('destination_page', 'Page destination');
            await analyze('Page destination');
        }

        // ── PHASE 3: Find the CTA / widget entry ──
        console.log('━━━ PHASE 3: Recherche du widget "Créer mon voyage" ━━━\n');

        const ctaSelectors = [
            'a:has-text("Créer mon voyage")',
            'button:has-text("Créer mon voyage")',
            'a:has-text("Demander un devis")',
            'button:has-text("Demander un devis")',
            'a:has-text("Organiser mon voyage")',
            'a:has-text("Préparer mon voyage")',
            'a:has-text("Créer votre voyage")',
            'button:has-text("Créer votre voyage")',
            '[class*="cta"]:visible',
            'a:has-text("Personnaliser")',
            'a:has-text("sur mesure")',
            'a:has-text("Demander")',
            'a:has-text("Je me lance")',
            'a:has-text("C\'est parti")',
        ];

        let ctaFound = await clickFirst(ctaSelectors, 'CTA Widget');

        if (!ctaFound) {
            // Try direct URL patterns for the form/wizard
            console.log('ℹ Tentative navigation directe vers formulaire...\n');
            const urls = [
                'https://www.evaneos.fr/maroc/creer-mon-voyage/',
                'https://www.evaneos.fr/maroc/demande-de-devis/',
                'https://www.evaneos.fr/maroc/itineraires/',
                'https://www.evaneos.fr/maroc/',
            ];
            for (const url of urls) {
                try {
                    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
                    if (resp && resp.status() < 400) {
                        await page.waitForTimeout(4000);
                        await snap('direct_nav', `Navigation: ${url}`);
                        await analyze(`Page: ${url}`);

                        ctaFound = await clickFirst(ctaSelectors, 'CTA sur page destination');
                        if (ctaFound) break;

                        // Check if this page itself IS the form/wizard
                        const hasFormElements = await page.evaluate(() => {
                            return document.querySelectorAll('input, select, [role="radio"], [role="slider"], [class*="step"], [class*="wizard"]').length;
                        });
                        if (hasFormElements > 2) {
                            console.log(`✓ Page formulaire détectée (${hasFormElements} éléments)\n`);
                            ctaFound = true;
                            break;
                        }
                    }
                } catch (e) {
                    console.log(`  ✗ ${url} — erreur: ${e.message.substring(0, 60)}`);
                }
            }
        }

        if (ctaFound) {
            await page.waitForTimeout(4000);
            await snap('widget_opened', 'Widget ouvert / première étape');
            await analyze('Widget — première étape');
        }

        // ── PHASE 4: Step-by-step widget exploration ──
        console.log('━━━ PHASE 4: Parcours du widget ━━━\n');

        for (let step = 0; step < 15; step++) {
            console.log(`── Étape d'exploration ${step + 1} ──\n`);

            await snap(`explore_${step + 1}`, `Exploration étape ${step + 1}`);
            const analysis = await analyze(`Exploration étape ${step + 1}`);

            // Detect current URL to track navigation
            const currentUrl = page.url();

            // Strategy: try to interact with form elements
            let acted = false;

            // 1. Try clicking selectable cards/options (pick the first one)
            const selectableClicked = await page.evaluate(() => {
                const sels = [
                    '[class*="card"]:not(.selected):not([class*="cookie"])',
                    '[class*="option"]:not(.selected):not([class*="cookie"])',
                    '[class*="choice"]:not(.active)',
                    '[class*="tile"]:not(.selected)',
                    '[class*="chip"]:not(.active)',
                    '[role="radio"]:not([aria-checked="true"])',
                    '[role="option"]',
                    'label:has(input[type="radio"]:not(:checked))',
                    '[class*="select-item"]',
                    '[class*="destination-item"]',
                    '[class*="experience"]',
                    '[data-testid]'
                ];
                for (const sel of sels) {
                    const items = [...document.querySelectorAll(sel)].filter(el =>
                        (el.offsetParent !== null || el.offsetWidth > 0) &&
                        el.closest('[class*="cookie"]') === null &&
                        el.closest('[class*="consent"]') === null
                    );
                    if (items.length > 0) {
                        items[0].click();
                        return {
                            found: true,
                            sel,
                            text: items[0].textContent.trim().substring(0, 60),
                            total: items.length
                        };
                    }
                }
                return { found: false };
            });

            if (selectableClicked.found) {
                console.log(`  ✓ Sélection: "${selectableClicked.text}" (${selectableClicked.total} options, via ${selectableClicked.sel})`);
                await page.waitForTimeout(1500);
                await snap(`selection_${step + 1}`, `Après sélection à l'étape ${step + 1}`);
                acted = true;
            }

            // 2. Try filling text inputs
            if (!acted) {
                const textInputs = await page.$$('input[type="text"]:visible, input[type="search"]:visible, input[type="email"]:visible, input:not([type]):visible, [role="combobox"]:visible');
                for (const input of textInputs) {
                    try {
                        if (await input.isVisible()) {
                            const placeholder = await input.getAttribute('placeholder') || '';
                            const inputType = await input.getAttribute('type') || 'text';
                            let value = 'Maroc';
                            if (placeholder.toLowerCase().includes('email') || inputType === 'email') value = 'test@example.com';
                            else if (placeholder.toLowerCase().includes('nom')) value = 'Dupont';
                            else if (placeholder.toLowerCase().includes('prénom')) value = 'Marie';
                            else if (placeholder.toLowerCase().includes('tel') || inputType === 'tel') value = '+33612345678';

                            await input.fill(value);
                            console.log(`  ✓ Saisie "${value}" dans [${inputType}] placeholder="${placeholder}"`);
                            await page.waitForTimeout(2000);

                            // Check for autocomplete dropdown
                            const hasDropdown = await page.evaluate(() => {
                                const dd = document.querySelector('[class*="dropdown"]:not([style*="display: none"]), [class*="suggest"], [class*="autocomplete"], [role="listbox"]');
                                return dd && (dd.offsetParent !== null || dd.offsetWidth > 0);
                            });
                            if (hasDropdown) {
                                await snap(`autocomplete_${step + 1}`, `Autocomplétion visible`);
                                // Click first suggestion
                                const suggClicked = await page.evaluate(() => {
                                    const items = [...document.querySelectorAll('[role="listbox"] [role="option"], [class*="dropdown"] li, [class*="suggest"] li, [class*="autocomplete"] li, [class*="dropdown"] a, [class*="dropdown"] div[class*="item"]')]
                                        .filter(el => el.offsetParent !== null);
                                    if (items.length > 0) {
                                        items[0].click();
                                        return items[0].textContent.trim().substring(0, 60);
                                    }
                                    return null;
                                });
                                if (suggClicked) {
                                    console.log(`  ✓ Suggestion sélectionnée: "${suggClicked}"`);
                                    await page.waitForTimeout(1500);
                                }
                            }
                            acted = true;
                            break;
                        }
                    } catch (e) {}
                }
            }

            // 3. Try sliders
            if (!acted) {
                try {
                    const slider = await page.$('input[type="range"]:visible, [role="slider"]:visible');
                    if (slider && await slider.isVisible()) {
                        console.log('  ✓ Slider détecté — ajustement');
                        await slider.fill('60');
                        await page.waitForTimeout(1000);
                        acted = true;
                    }
                } catch (e) {}
            }

            // 4. Try "next" / "continue" buttons
            const nextClicked = await clickFirst([
                'button:has-text("Suivant")',
                'button:has-text("Continuer")',
                'button:has-text("Valider")',
                'button:has-text("Next")',
                'button:has-text("Envoyer")',
                'button:has-text("Confirmer")',
                'button[type="submit"]:visible',
                '[class*="next"]:visible',
                '[class*="submit"]:visible',
                'a:has-text("Suivant")',
                'a:has-text("Continuer")',
            ], 'Bouton suivant');

            if (nextClicked) {
                await page.waitForTimeout(3000);
                acted = true;
            }

            // Check if URL changed (page navigation)
            const newUrl = page.url();
            if (newUrl !== currentUrl) {
                console.log(`  → Navigation: ${currentUrl} → ${newUrl}\n`);
            }

            if (!acted && !nextClicked) {
                console.log('  ℹ Aucune interaction possible — fin de parcours probable\n');
                if (step > 4) break; // Stop if we've been stuck for a while
                // Try scrolling down to reveal more content
                await page.evaluate(() => window.scrollBy(0, 500));
                await page.waitForTimeout(1000);
            }
        }

        // ── PHASE 5: Final captures ──
        console.log('━━━ PHASE 5: Captures finales ━━━\n');
        await snap('final_state', 'État final du parcours');
        await analyze('État final');

        // Full page
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'full_page_final.png'), fullPage: true });
        console.log('📸 Capture pleine page finale\n');

    } catch (error) {
        console.error(`❌ Erreur: ${error.message}\n`);
        try { await snap('error', `Erreur: ${error.message.substring(0, 60)}`); } catch (e) {}
    } finally {
        await browser.close();
        console.log('✓ Navigateur fermé\n');

        const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
        console.log(`=== Observation terminée — ${files.length} captures ===`);
        files.forEach(f => console.log(`  📸 ${f}`));
    }
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });

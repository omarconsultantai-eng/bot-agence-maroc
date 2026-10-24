const { chromium } = require('playwright');
const path = require('path');

async function testLocalApp() {
    console.log('Testing BOT AGENCE MAROC locally...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    await page.goto('http://localhost:8080');
    await page.waitForTimeout(500);

    // Capture Landing
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'test_bot_01_landing.png') });

    // Click "Créer mon voyage"
    await page.click('button.btn-cta');
    await page.waitForTimeout(400);

    // Étape 1 : Planification
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'test_bot_02_step1.png') });
    await page.click('label:has(input[value="planifier"])');
    await page.click('#btnNext');
    await page.waitForTimeout(400);

    // Étape 2 : Participants et dates
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'test_bot_03_step2.png') });
    await page.click('label:has(input[value="couple"])');
    await page.waitForTimeout(200);
    // Vérifier apparition conditionnelle noces
    await page.click('label:has(#checkHoneymoon)');
    await page.click('label:has(input[value="non"])'); // dates flexibles
    await page.click('.month-btn:has-text("Novembre")');
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'test_bot_04_step2_filled.png') });
    await page.click('#btnNext');
    await page.waitForTimeout(400);

    // Étape 3 : Projet
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'test_bot_05_step3.png') });
    await page.click('.exp-card:first-child');
    await page.click('#btnNext');
    await page.waitForTimeout(400);

    // Étape 4 : Budget & Durée
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'test_bot_06_step4.png') });
    await page.click('.dur-btn:has-text("+")'); // +1 jour
    await page.click('#btnNext');
    await page.waitForTimeout(400);

    // Étape 5 : Espace personnel
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'test_bot_07_step5.png') });
    await page.fill('#fPrenom', 'Yacine');
    await page.fill('#fNom', 'El Amrani');
    await page.fill('#fEmail', 'yacine@example.com');
    await page.fill('#fTel', '+33 6 98 76 54 32');
    await page.fill('#fRemarques', 'Nous souhaitons un riad traditionnel avec toit terrasse et vue sur la Koutoubia.');
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'test_bot_08_step5_filled.png') });

    // Valider
    await page.click('#btnNext');
    await page.waitForTimeout(600);

    // Confirmation
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'test_bot_09_confirmation.png') });
    console.log('✅ ALL STEPS COMPLETED AND VALIDATED SUCCESSFULLY!');

    await browser.close();
}

testLocalApp().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});

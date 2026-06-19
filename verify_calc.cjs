const { chromium } = require('./node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  await page.goto('http://localhost:3099/login');
  await page.fill('input[type="email"]', 'renato086@gmail.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.includes('/login'), { timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  await page.goto('http://localhost:3099/calculadora');
  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: 'calc_sistema.png', fullPage: false });

  const body = await page.textContent('body');
  console.log('Has Editar button:', body.includes('Editar'));
  console.log('Has Parametros e pesos:', body.includes('metros e pesos'));
  console.log('Has Faixa 1:', body.includes('Faixa 1'));
  console.log('Has Score Final:', body.includes('Score Final'));
  console.log('Has Teto:', body.includes('Teto'));

  const tabs = await page.getByRole('button').all();
  for (const t of tabs) {
    const txt = await t.textContent();
    if (txt && txt.includes('Comodato')) { await t.click(); break; }
  }
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'calc_comodato.png', fullPage: false });
  const body2 = await page.textContent('body');
  console.log('Comodato edite diretamente:', body2.includes('edite diretamente'));
  console.log('Comodato digital:', body2.includes('digital'));
  console.log('Comodato Restaurar:', body2.includes('Restaurar'));

  await browser.close();
  console.log('DONE');
})();

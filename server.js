const express = require('express');
const { connect } = require('puppeteer-real-browser');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// --- Helpers ---

async function createBrowser() {
  const { browser, page } = await connect({
    headless: 'new',
    turnstile: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-notifications',
      '--disable-popup-blocking'
    ]
  });

  browser.on('targetcreated', async (target) => {
    try {
      const p = await target.page();
      if (p && p !== page) await p.close();
    } catch {}
  });

  await page.setViewport({ width: 1920, height: 1080 });

  return { browser, page };
}

async function warmup(page, url) {
  console.log('Warmup:', url);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1000);
}

async function navigate(page, url, options) {
  console.log('Navigate:', url);
  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: options.timeout,
    referer: options.referer
  });
}

async function scrollPage(page) {
  await page.evaluate(async () => {
    let y = 0;
    const step = 500;
    const h = document.body.scrollHeight;
    while (y < h) {
      window.scrollBy(0, step);
      y += step;
      await new Promise(r => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });
  await sleep(2000);
}

async function waitForImages(page) {
  await page.evaluate(async () => {
    const imgs = document.querySelectorAll('img');
    await Promise.all([...imgs].map(img => {
      if (img.complete) return;
      return new Promise(r => {
        img.onload = img.onerror = r;
        setTimeout(r, 5000);
      });
    }));
  });
}

async function takeScreenshot(page, options) {
  const opts = { fullPage: options.fullPage, type: options.type };
  if (options.type === 'jpeg' || options.type === 'jpg') {
    opts.type = 'jpeg';
    opts.quality = options.quality;
  }
  return page.screenshot(opts);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// --- API ---

app.post('/screenshot', async (req, res) => {
  const {
    url,
    timeout = 60000,
    fullPage = true,
    quality = 80,
    type = 'png',
    wait = 5,
    warmup: doWarmup = true,
    warmupUrl = 'https://www.google.ru/'
  } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let browser = null;

  try {
    console.log(`[${new Date().toISOString()}] Screenshot: ${url}`);

    const result = await createBrowser();
    browser = result.browser;
    const page = result.page;

    if (doWarmup) {
      await warmup(page, warmupUrl);
    }

    await navigate(page, url, { timeout, referer: doWarmup ? warmupUrl : undefined });

    if (wait > 0) {
      console.log(`Wait ${wait}s...`);
      await sleep(wait * 1000);
    }

    await scrollPage(page);
    await waitForImages(page);

    console.log('Screenshot...');
    const screenshot = await takeScreenshot(page, { fullPage, type, quality });

    await browser.close();
    browser = null;

    console.log(`Done: ${screenshot.length} bytes`);

    res.set('Content-Type', `image/${type === 'jpg' ? 'jpeg' : type}`);
    res.send(screenshot);

  } catch (error) {
    console.error('Error:', error.message);
    if (browser) try { await browser.close(); } catch {}
    res.status(500).json({ error: error.message, url });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Puppeteer API on port ${PORT}`);
});

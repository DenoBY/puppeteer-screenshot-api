const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/screenshot', async (req, res) => {
  const {
    url,
    timeout = 60000,
    fullPage = true,
    quality = 80,
    type = 'png',
    wait = 3
  } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let browser = null;

  try {
    console.log(`[${new Date().toISOString()}] Screenshot: ${url}`);

    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('Navigate:', url);
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout
    });

    console.log('Loaded:', page.url());

    if (wait > 0) {
      console.log(`Wait ${wait}s...`);
      await sleep(wait * 1000);
    }

    console.log('Screenshot...');
    const opts = { fullPage, type: type === 'jpg' ? 'jpeg' : type };
    if (type === 'jpeg' || type === 'jpg') {
      opts.quality = quality;
    }
    const screenshot = await page.screenshot(opts);

    await browser.close();
    browser = null;

    console.log(`Done: ${screenshot.length} bytes`);

    res.set('Content-Type', `image/${type === 'jpg' ? 'jpeg' : type}`);
    res.end(screenshot);

  } catch (error) {
    console.error('Error:', error.message);
    if (browser) try { await browser.close(); } catch {}
    res.status(500).json({ error: error.message, url });
  }
});

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Screenshot API on port ${PORT}`);
});

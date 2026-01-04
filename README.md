# Puppeteer Screenshot API

REST API for taking screenshots with anti-bot bypass (puppeteer-real-browser).

## Run

```bash
docker build -t puppeteer-api .
docker run -d -p 3000:3000 --restart unless-stopped --name puppeteer-api puppeteer-api
```

API available at http://localhost:3000

## API

### Screenshot

```
POST /screenshot
Content-Type: application/json

{
  "url": "https://example.com",
  "timeout": 60000,
  "fullPage": true,
  "quality": 80,
  "type": "png",
  "wait": 5,
  "warmup": true,
  "warmupUrl": "https://www.google.com/"
}
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| url | string | required | Page URL |
| timeout | number | 60000 | Page load timeout (ms) |
| fullPage | boolean | true | Capture full page |
| quality | number | 80 | JPEG quality (1-100) |
| type | string | "png" | Format: png, jpeg |
| wait | number | 5 | Wait after load (sec) |
| warmup | boolean | true | Warmup via Google |
| warmupUrl | string | "https://www.google.com/" | Warmup URL |

**Response:** Binary image (PNG/JPEG)

## Example

```bash
curl -X POST http://localhost:3000/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}' \
  -o screenshot.png
```

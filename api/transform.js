import { put } from '@vercel/blob';
import sharp from 'sharp';

export default async function handler(req, res) {
    const { url, top, left, width, height, compression } = req.query;
    if (!url) return res.status(400).send('missing url');

    // Create a deterministic cache key
    const key = `cache/${Buffer.from(`${url}-${top}-${left}-${width}-${height}-${compression}`).toString('base64url')}.webp`;

    // Try to serve from cache first
    try {
        const cached = await fetch(`https://${process.env.VERCEL_URL}/` + key);
        res.setHeader('Content-Type', 'image/webp');
        cached.body.pipe(res);
        return;
    } catch {}

    // Not cached – transform
    const orig = await fetch(url);

    // Make sure all values are integers
    const leftInt = Math.floor(Number(left));
    const topInt = Math.floor(Number(top));
    const widthInt = Math.floor(Number(width));
    const heightInt = Math.floor(Number(height));

    console.log('Transform params:', { leftInt, topInt, widthInt, heightInt });

    const image = sharp(await orig.arrayBuffer())
        .extract({ left: leftInt, top: topInt, width: widthInt, height: heightInt })
        .webp({ quality: Math.floor(Number(compression)) * 10 }); // 1-9 → 10-90 %
    const buffer = await image.toBuffer();
    await put(key, buffer, { access: 'public', contentType: 'image/webp' });

    res.setHeader('Content-Type', 'image/webp');
    res.send(buffer);
}
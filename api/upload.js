import { put, head } from '@vercel/blob';
import crypto from 'crypto';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { filename, contentType, base64 } = req.body;
    const buffer = Buffer.from(base64, 'base64');

    // 1. stable key = sha256 of the file bytes
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const key = `by-hash/${hash}`;

    // 2. already uploaded? return existing URL
    try {
        const { url } = await head(key);
        return res.json({ url });
    } catch (e) {
        // not found → proceed to upload
    }

    // 3. upload once, forever cached by hash
    const { url } = await put(key, buffer, { contentType, access: 'public' });
    res.json({ url });
}
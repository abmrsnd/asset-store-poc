export async function upload(file) {
    try {
        console.log('Upload function called with file:', file?.name);
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        console.log('File converted to base64, making API request');
        const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, contentType: file.type, base64 })
        });
        if (!res.ok) {
            console.error('API response not OK:', res.status, res.statusText);
            throw new Error(`API response error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log('Upload API response:', data);
        return data;
    } catch (error) {
        console.error('Error in upload function:', error);
        throw error;
    }
}
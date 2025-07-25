import { useRouter } from 'next/router';

export default function Serve() {
    const { id, top, left, bottom, right, compression } = useRouter().query;
    if (!id) return <p>loading…</p>;
    // Ensure all values are parsed as integers
    const leftInt = parseInt(left, 10) || 0;
    const topInt = parseInt(top, 10) || 0;
    const rightInt = parseInt(right, 10) || 0;
    const bottomInt = parseInt(bottom, 10) || 0;
    const compressionInt = parseInt(compression, 10) || 8;

    const width = rightInt - leftInt;
    const height = bottomInt - topInt;
    const url = `https://yourblobstore.public.blob.vercel-storage.com/orig/${id}`;
    const params = new URLSearchParams({
        url: url,
        left: leftInt,
        top: topInt,
        width: width,
        height: height,
        compression: compressionInt
    });
    const src = `/api/transform?${params.toString()}`;
    return <img src={src} alt="cropped" style={{ maxWidth: '100%' }} />;
}
import { useState, useEffect, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { upload } from '../lib/upload';

export default function Uploader() {
    const [file, setFile] = useState();
    const [objectURL, setObjectURL] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [compression, setCompression] = useState(8);
    const [preview, setPreview] = useState();

    // store real pixel dimensions
    const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
    // Store the actual cropped area in pixels
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const imgRef = useRef(null);

    // create / revoke object URL
    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setObjectURL(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    // once the image loads, read its real size
    function onImageLoad(e) {
        const { naturalWidth, naturalHeight } = e.target;
        setImgSize({ w: naturalWidth, h: naturalHeight });
    }

    async function handleSave() {
        console.log('handleSave called', { imgSize, croppedAreaPixels });
        if (!imgSize.w || !imgSize.h) {
            console.log('Early return: image size is missing');
            return;
        }

        if (!croppedAreaPixels) {
            console.log('Early return: croppedAreaPixels not available');
            return;
        }

        // Use exact pixel values from the cropper
        const { x: left, y: top, width, height } = croppedAreaPixels;

        // Make sure all values are integers
        const safeLeft = Math.floor(left);
        const safeTop = Math.floor(top);
        const safeWidth = Math.floor(width);
        const safeHeight = Math.floor(height);

        console.log('Using crop dimensions from croppedAreaPixels:', { safeLeft, safeTop, safeWidth, safeHeight });

        // upload original
        try {
            console.log('About to upload file', { fileName: file?.name, fileType: file?.type });
            const result = await upload(file);
            console.log('Upload result:', result);
            const { url: orig } = result;
            // Ensure all parameters are integers
            const params = new URLSearchParams({
                url: orig,
                left: Math.floor(safeLeft),
                top: Math.floor(safeTop),
                width: Math.floor(safeWidth),
                height: Math.floor(safeHeight),
                compression: Math.floor(compression)
            });
            const transformed = `/api/transform?${params.toString()}`;
            console.log('Setting preview to:', transformed);
            setPreview(transformed);
        } catch (error) {
            console.error('Error in handleSave:', error);
        }
    }

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
            <h2>Upload & crop</h2>
            <input
                type="file"
                accept="image/*"
                onChange={e => {
                    setFile(e.target.files[0]);
                    setPreview(null);
                }}
            />

            {objectURL && (
                <>
                    <div style={{ position: 'relative', width: '100%', height: 400, margin: '16px 0', border: '1px solid #ccc' }}>
                        <Cropper
                            image={objectURL}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={(newCrop) => {
                                console.log('Crop changed:', newCrop);
                                setCrop(newCrop);
                            }}
                            onZoomChange={(newZoom) => {
                                console.log('Zoom changed:', newZoom);
                                setZoom(newZoom);
                            }}
                            onCropComplete={(croppedArea, croppedAreaPixels) => {
                                console.log('Crop complete, pixels:', croppedAreaPixels);
                                setCroppedAreaPixels(croppedAreaPixels);
                            }}
                            onMediaLoaded={({ width, height }) => {
                                console.log('Image loaded with dimensions:', { width, height });
                                setImgSize({ w: width, h: height });
                            }}
                        />
                    </div>

                    <label style={{ display: 'block', marginBottom: 12 }}>
                        Compression 1-9:
                        <input
                            type="range"
                            min="1"
                            max="9"
                            value={compression}
                            onChange={e => setCompression(e.target.value)}
                            style={{ marginLeft: 8 }}
                        />
                        <strong style={{ marginLeft: 6 }}>{compression}</strong>
                    </label>

                    <button onClick={handleSave} >
                        Save & Preview
                    </button>
                </>
            )}

            {preview && (
                <>
                    <h3>Result</h3>
                    <img src={preview} alt="result" style={{ maxWidth: '100%' }} />
                    <p>Direct link: <a href={preview} target="_blank" rel="noopener">{preview}</a></p>
                </>
            )}
        </div>
    );
}
export const uploadImageToCloudinary = (file, folder = 'profiles', onProgress) => {
    return new Promise((resolve, reject) => {
        if (!file) { reject(new Error('No file provided')); return; }
        if (!file.type.startsWith('image/')) { reject(new Error('File must be an image')); return; }
        if (file.size > 5 * 1024 * 1024) { reject(new Error('Image must be under 5MB')); return; }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'lan_library_docs');
        formData.append('folder', folder);
        // ← REMOVED: formData.append('access_mode', 'public');

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                resolve(data.secure_url);
            } else {
                const err = JSON.parse(xhr.responseText);
                reject(new Error(err.error?.message || 'Upload failed'));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Upload failed. Check your connection.'));
        });

        xhr.open('POST', 'https://api.cloudinary.com/v1_1/dgkuyf3dq/image/upload');
        xhr.send(formData);
    });
};
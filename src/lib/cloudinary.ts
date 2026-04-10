const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!cloudName) {
  throw new Error("VITE_CLOUDINARY_CLOUD_NAME is required for uploads.");
}

if (!uploadPreset) {
  throw new Error("VITE_CLOUDINARY_UPLOAD_PRESET is required for uploads.");
}

export const cloudinaryService = {
  async uploadFile(file: File, folder = "decisiondna"): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudinary upload failed: ${errorText}`);
    }

    const result = (await response.json()) as { secure_url?: string };
    if (!result.secure_url) {
      throw new Error("Cloudinary upload failed: missing secure_url in response.");
    }

    return result.secure_url;
  },
};

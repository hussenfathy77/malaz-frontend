import { getApiBaseUrl, getStoredToken } from '../config/api';

const getAuthToken = async () => {
  try {
    return await getStoredToken();
  } catch {
    return null;
  }
};

export const uploadService = {
  /**
   * Upload a profile picture (image file)
   * @param {object} fileAsset - from expo-image-picker result: { uri, mimeType, fileName }
   */
  async uploadProfilePic(fileAsset) {
    const token = await getAuthToken();
    const baseUrl = await getApiBaseUrl();
    const formData = new FormData();
    formData.append('profile_pic', {
      uri: fileAsset.uri,
      type: fileAsset.mimeType || fileAsset.type || 'image/jpeg',
      name: fileAsset.fileName || fileAsset.name || 'profile.jpg',
    });

    const res = await fetch(`${baseUrl}/uploads/profile-pic`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type for multipart/form-data — fetch sets it automatically
      },
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.message || 'Failed to upload profile picture');
    }
    return json?.data?.profile_pic || null;
  },

  /**
   * Upload a doctor certificate (PDF or image)
   * @param {object} fileAsset - from expo-document-picker or expo-image-picker result
   */
  async uploadCertificate(fileAsset) {
    const token = await getAuthToken();
    const baseUrl = await getApiBaseUrl();
    const formData = new FormData();
    formData.append('certificate', {
      uri: fileAsset.uri,
      type: fileAsset.mimeType || fileAsset.type || 'application/pdf',
      name: fileAsset.name || fileAsset.fileName || 'certificate.pdf',
    });

    const res = await fetch(`${baseUrl}/uploads/certificate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.message || 'Failed to upload certificate');
    }
    return json?.data?.certificate_url || null;
  },
};

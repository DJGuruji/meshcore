import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to convert stream to promise for Cloudinary upload
function streamUpload(buffer: Buffer, options: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
    
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

// Function to upload a file to Cloudinary based on its type
export async function uploadFileToCloudinary(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  fieldName: string
) {
  // Determine folder and resource type based on MIME type
  let folder = process.env.CLOUDINARY_FILE_FOLDER || 'files';
  let resourceType = 'auto';
  let fileType = 'file';
  
  if (mimeType.startsWith('image/')) {
    folder = process.env.CLOUDINARY_IMAGE_FOLDER || 'images';
    resourceType = 'image';
    fileType = 'image';
  } else if (mimeType.startsWith('video/')) {
    folder = process.env.CLOUDINARY_VIDEO_FOLDER || 'videos';
    resourceType = 'video';
    fileType = 'video';
  } else if (mimeType.startsWith('audio/')) {
    folder = process.env.CLOUDINARY_AUDIO_FOLDER || 'audios';
    resourceType = 'video'; // Cloudinary treats audio as video
    fileType = 'audio';
  }
  
  // Generate a unique filename
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 15);
  const fileName = `${fieldName}-${timestamp}-${randomSuffix}`;
  
  try {
    const result = await streamUpload(buffer, {
      folder: folder,
      resource_type: resourceType,
      public_id: fileName,
      overwrite: false,
      invalidate: true,
    });
    
    return {
      fieldName,
      fileType,
      fileName: result.original_filename || originalName,
      originalName,
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type,
      fileSize: result.bytes,
    };
  } catch (error) {
    throw new Error(`Failed to upload file to Cloudinary: ${(error as Error).message}`);
  }
}

// Function to delete a file from Cloudinary
export async function deleteFileFromCloudinary(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Failed to delete file from Cloudinary:', error);
    return false;
  }
}

export default cloudinary;
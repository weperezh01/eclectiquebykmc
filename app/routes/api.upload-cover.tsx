import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({ error: 'Method not allowed' }, { status: 405 });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    console.log('Cover upload request received');
    const formData = await request.formData();
    const file = formData.get('cover') as File;
    
    console.log('File info:', { 
      name: file?.name, 
      size: file?.size, 
      type: file?.type 
    });

    if (!file || file.size === 0) {
      console.log('No file provided or file size is 0');
      return json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return json({ 
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB for cover images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    // Generate unique filename with cover prefix
    const timestamp = Date.now();
    const extension = path.extname(file.name);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
    const filename = `cover-${timestamp}-${sanitizedName}${extension}`;
    
    // Ensure uploads directory exists (using persistent volume path)
    const uploadsDir = path.join(process.cwd(), 'public', 'images', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file
    const filepath = path.join(uploadsDir, filename);
    console.log('Saving file to:', filepath);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);
    console.log('File saved successfully');

    // Return the public URL (now using persistent path)
    const publicUrl = `/images/uploads/${filename}`;

    console.log('Upload successful, returning URL:', publicUrl);
    return json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Error uploading cover image:', error);
    return json({ error: 'Failed to upload cover image' }, { status: 500 });
  }
};
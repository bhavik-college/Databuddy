import { S3Client } from "bun";
import { nanoid } from "nanoid";

export class S3UploadManager {
    private client: S3Client;

    constructor() {
        this.client = new S3Client({
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            bucket: process.env.R2_BUCKET,
            endpoint: process.env.R2_ENDPOINT,
        });
    }

    async uploadFile(file: File, options: { isPublic?: boolean } = {}) {
        const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
        const key = `${nanoid()}-${safeFilename}`;

        await this.client.write(key, file, {
            acl: options.isPublic ? 'public-read' : undefined,
        });

        if (options.isPublic) {
            const publicUrl = `https://cdn.databuddy.cc/${key}`;
            return { key, url: publicUrl };
        }

        return { key };
    }

    async deleteFileFromUrl(url: string) {
        try {
            const key = url.split('/').pop();
            if (key) {
                await this.client.delete(key);
            }
        } catch (error) {
            console.error("Error deleting file from URL:", error);
        }
    }

    async getFileUrl(key: string) {
        return this.client.presign(key, {
            expiresIn: 60 * 5, // 5 minutes
        });
    }

    async deleteFile(key: string) {
        await this.client.delete(key);
    }

    async listFiles() {
        return this.client.list();
    }
}

export const s3 = new S3UploadManager();
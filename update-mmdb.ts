import chalk from "chalk";

const STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE_NAME;
const ACCESS_KEY = process.env.BUNNY_STORAGE_ACCESS_KEY;
const REGION = process.env.BUNNY_STORAGE_REGION || "";

if (!STORAGE_ZONE_NAME) {
    console.error(chalk.red("❌ Missing BUNNY_STORAGE_ZONE_NAME env var"));
    process.exit(1);
}

if (!ACCESS_KEY) {
    console.error(chalk.red("❌ Missing BUNNY_STORAGE_ACCESS_KEY env var"));
    process.exit(1);
}

const BASE_URL = REGION
    ? `https://${REGION}.storage.bunnycdn.com`
    : "https://storage.bunnycdn.com";

const SOURCE_URL =
    "https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-City.mmdb";
const FILENAME = "mmdb/GeoLite2-City-test.mmdb";

async function downloadFile(url: string): Promise<ArrayBuffer> {
    console.log(chalk.blue(`📥 Downloading ${url}...`));
    const start = performance.now();

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const duration = (performance.now() - start).toFixed(0);
    const sizeMB = (arrayBuffer.byteLength / 1024 / 1024).toFixed(2);

    console.log(
        chalk.green(`✅ Downloaded ${FILENAME}`) +
        chalk.dim(` (${sizeMB} MB) in ${duration}ms`)
    );

    return arrayBuffer;
}

async function uploadFile(filename: string, content: ArrayBuffer): Promise<void> {
    const url = `${BASE_URL}/${STORAGE_ZONE_NAME}/${filename}`;
    const sizeMB = (content.byteLength / 1024 / 1024).toFixed(2);

    console.log(chalk.blue(`📤 Uploading ${filename} (${sizeMB} MB)...`));

    const start = performance.now();
    const response = await fetch(url, {
        method: "PUT",
        headers: {
            AccessKey: ACCESS_KEY as string,
            "Content-Type": "application/octet-stream",
        },
        body: content,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const duration = (performance.now() - start).toFixed(0);
    console.log(
        chalk.green(`✅ Uploaded ${filename}`) + chalk.dim(` in ${duration}ms`)
    );
}

async function main() {
    try {
        const fileData = await downloadFile(SOURCE_URL);
        await uploadFile(FILENAME, fileData);
        console.log(chalk.green("\n✨ Successfully updated MMDB file!"));
    } catch (error) {
        console.error(chalk.red("\n❌ Failed to update MMDB file:"), error);
        process.exit(1);
    }
}

main();

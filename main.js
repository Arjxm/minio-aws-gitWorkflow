import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';


AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_SECRET_REGION
});


const s3TemplateDirectories = {
    newsignup: './email-templates/new-signup/new-signup-user'
}


// AWS S3 configuration
const s3BucketName = 'email-templatess';


// Function to upload a new directory to S3
async function uploadDirToS3(dirPath, bucketName, s3Key) {
    const s3 = new AWS.S3();

    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const file_path = path.join(dirPath, file);
        const s3_key = path.relative(s3TemplateDirectories[s3Key], file_path) + '/';

        // Upload the file to S3
        try {
            const fileStream = fs.createReadStream(file_path);
            const s3Params = {
                Bucket: bucketName,
                Key: s3Key + s3_key + file,
                Body: fileStream,
            };
            await s3.upload(s3Params).promise();
            console.log(`Uploaded ${file_path} to S3 at ${s3Key + s3_key}`);
        } catch (err) {
            console.error(`Error uploading ${file_path} to S3: ${err}`);
        }
    }
}

// Function to delete all directories inside the bucket
async function deleteAllDirectories(bucketName) {
    const s3 = new AWS.S3();

    try {
        const data = await s3.listObjectsV2({ Bucket: bucketName }).promise();
        if (data.CommonPrefixes.length > 0) {
            const deleteParams = {
                Bucket: bucketName,
                Delete: { Objects: data.CommonPrefixes.map((dir) => ({ Key: dir.Prefix })) },
            };
            await s3.deleteObjects(deleteParams).promise();
        }
    } catch (err) {
        console.error(`Error deleting directories from ${bucketName}: ${err}`);
    }
}

// Start the update process for each directory
async function main() {
    await deleteAllDirectories(s3BucketName);

    for (const dir in s3TemplateDirectories) {
        console.log(`Processing directory: ${dir}`);
        await uploadDirToS3(s3TemplateDirectories[dir], s3BucketName, dir);
    }

    console.log('S3 update completed.');
}

main();

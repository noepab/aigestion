
import { google } from 'googleapis';


async function testDriveAuth() {
    console.log('🔍 Testing Google Drive Authentication...');

    try {
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/drive'],
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
        });

        const client = await auth.getClient();
        console.log('✅ Auth client retrieved.');

        // Check credentials type
        const projectId = await auth.getProjectId();
        console.log(`ℹ️  Project ID: ${projectId}`);

        // Attempt real API call
        console.log('📡 Attempting to list files from Drive...');
        const drive = google.drive({ version: 'v3', auth: client as any });

        const res = await drive.files.list({
            pageSize: 5,
            fields: 'files(id, name)',
        });

        console.log('🎉 Success! Found files:', res.data.files?.length || 0);
        if (res.data.files && res.data.files.length > 0) {
            res.data.files.forEach(f => console.log(`   - ${f.name} (${f.id})`));
        }

        console.log('\n✅ AUTH VERIFICATION PASSED');
    } catch (error: any) {
        console.error('\n❌ AUTH VERIFICATION FAILED');
        console.error('Error details:', error.message);

        if (error.message.includes('invalid_grant') || error.message.includes('insufficient_scope')) {
            console.log('\n💡 SUGGESTION: Run the following command to fix scopes:');
            console.log('gcloud auth application-default login --scopes=https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/cloud-platform');
        }
        process.exit(1);
    }
}

testDriveAuth();

// premium management module
import fs from 'fs';
import path from 'path';

export interface PremiumCredential {
    email: string;
    password: string;
    type: 'personal' | 'professional';
}

const credentialsPath = path.resolve(__dirname, 'premium_credentials.json');

export function loadPremiumCredentials(): PremiumCredential[] {
    const raw = fs.readFileSync(credentialsPath, { encoding: 'utf-8' });
    return JSON.parse(raw) as PremiumCredential[];
}

export function validateCredential(email: string, password: string): boolean {
    const creds = loadPremiumCredentials();
    return creds.some(c => c.email === email && c.password === password);
}

// Google Password Manager credentials
const googleCredentialsPath = path.resolve(__dirname, 'google_password_manager.json');

export interface GoogleCredential {
    email: string;
    password: string;
}

export function loadGooglePasswordManagerCredentials(): GoogleCredential[] {
    const raw = fs.readFileSync(googleCredentialsPath, { encoding: 'utf-8' });
    return JSON.parse(raw) as GoogleCredential[];
}

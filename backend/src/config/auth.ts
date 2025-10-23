import 'dotenv/config';

const getEnvVar = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        console.error(`${name} environment variable is not set.`);
        process.exit(1);
    }
    return value;
};

export const authConfig = {
    jwt: {
        secret: getEnvVar('JWT_SECRET_KEY'),
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
    },
    refresh: {
        secret: process.env.JWT_REFRESH_SECRET_KEY || getEnvVar('JWT_SECRET_KEY'),
        expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '30d',
    },
};

console.log('Auth config loaded successfully.');

import { env } from './env.js';

export const isImgbbConfigured = Boolean(env.imgbb.apiKey);
export const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

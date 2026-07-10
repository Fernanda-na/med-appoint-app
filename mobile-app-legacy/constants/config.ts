import { Platform } from 'react-native';

// Par défaut, nous utilisons localhost pour iOS/Web et 10.0.2.2 pour l'émulateur Android.
// Si vous testez sur un appareil physique (Expo Go), remplacez par l'adresse IP locale de votre machine (ex: '192.168.1.50').
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = `http://${HOST}:8081/api/v1`;
export const UPLOADS_BASE_URL = `http://${HOST}:8081/uploads`;

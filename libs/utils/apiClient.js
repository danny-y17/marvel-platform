import axios from 'axios';

// Define the base URLs for development and production
const MARVEL_API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.MARVEL_API_BASE_URL
    : 'http://127.0.0.1:5001/marvelai-c7b53/us-central1/';

const KAI_API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.KAI_API_BASE_URL
    : 'http://127.0.0.1:5001/kai-platform-sandbox/us-central1/';

const apiClient = axios.create({
  baseURL: MARVEL_API_BASE_URL,
  withCredentials: true, // ✅ Ensures cookies are included in all requests to maintain session state and handle authentication
});

const kaiAPI = axios.create({
  baseURL: KAI_API_BASE_URL,
  withCredentials: true,
});

export { apiClient, kaiAPI };

export const isFirebaseConfigured =
  import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here' &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'your_project_id';

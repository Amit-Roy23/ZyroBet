import PostHog from 'posthog-react-native';

export { PostHog };

export function createPostHogClient(apiKey: string, options?: any) {
  try {
    return new PostHog(apiKey, options);
  } catch (err) {
    console.warn('[PostHog.native] Failed to initialize PostHog:', err);
    return null;
  }
}

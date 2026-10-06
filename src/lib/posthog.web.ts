/**
 * Web-safe PostHog wrapper.
 * Stubs native posthog-react-native client on the web.
 */
export class PostHog {
  private apiKey: string;

  constructor(apiKey: string, _options?: any) {
    this.apiKey = apiKey;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  capture(_eventName: string, _properties?: any) {}
  identify(_distinctId: string, _userProperties?: any) {}
  reset() {}
  flush() {}
}

export function createPostHogClient(apiKey: string, options?: any) {
  return new PostHog(apiKey, options);
}

import { Share } from 'react-native';

export interface ShareOptions {
  title?: string;
  message: string;
  url?: string;
}

export interface ShareResult {
  completed: boolean;
  copiedToClipboard?: boolean;
}

export async function shareContent(options: ShareOptions): Promise<ShareResult> {
  try {
    const result = await Share.share({
      title: options.title,
      message: options.message + (options.url ? `\n${options.url}` : ''),
      url: options.url,
    });
    return {
      completed: result.action === Share.sharedAction,
    };
  } catch {
    return { completed: false };
  }
}

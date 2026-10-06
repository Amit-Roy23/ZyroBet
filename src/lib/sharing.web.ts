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
  const shareUrl = options.url || (typeof window !== 'undefined' ? window.location.origin : '');
  const shareData = {
    title: options.title || 'ZyroBet',
    text: options.message,
    url: shareUrl || undefined,
  };

  // 1. Try Web Share API if supported
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(shareData);
      return { completed: true };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { completed: false };
      }
      // If error (e.g. invalid url), fall through to clipboard
    }
  }

  // 2. Fall back to copying to clipboard
  try {
    const textToCopy = `${options.message}${shareUrl ? ` ${shareUrl}` : ''}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(textToCopy);
      return { completed: true, copiedToClipboard: true };
    }
  } catch {
    // Clipboard failed
  }

  return { completed: false };
}

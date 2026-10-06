import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Custom web HTML template for ZyroBet (Expo SDK 57)
 * Implements 100dvh behavior to eliminate mobile browser viewport jumps,
 * disables pull-to-refresh / scroll bounce, and sets dark green theme background.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <title>ZyroBet</title>
        <meta name="theme-color" content="#07140F" />
        <meta name="description" content="ZyroBet Casual Skill & Mini-Games" />

        {/* Expo reset */}
        <ScrollViewStyleReset />

        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                height: 100%;
                height: 100dvh;
                margin: 0;
                padding: 0;
                background-color: #07140F;
                overflow: hidden;
                overscroll-behavior: none;
                -webkit-overflow-scrolling: touch;
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
              }
              #root {
                display: flex;
                flex-direction: column;
                height: 100%;
                height: 100dvh;
                width: 100%;
                background-color: #07140F;
                overflow: hidden;
              }
              /* Responsive scrollbar styling for web */
              ::-webkit-scrollbar {
                width: 6px;
                height: 6px;
              }
              ::-webkit-scrollbar-track {
                background: #07140F;
              }
              ::-webkit-scrollbar-thumb {
                background: #1B382B;
                border-radius: 3px;
              }
              ::-webkit-scrollbar-thumb:hover {
                background: #2ECC71;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

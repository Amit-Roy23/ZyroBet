import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'phone' | 'tablet' | 'desktop';

export interface BreakpointInfo {
  breakpoint: Breakpoint;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

/**
 * Responsive layout hook based on viewport width:
 * - phone: < 600px
 * - tablet: 600px <= width < 1024px
 * - desktop: >= 1024px
 */
export function useBreakpoint(): BreakpointInfo {
  const { width, height } = useWindowDimensions();

  const isPhone = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;

  const breakpoint: Breakpoint = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'phone';

  return {
    breakpoint,
    isPhone,
    isTablet,
    isDesktop,
    width,
    height,
  };
}

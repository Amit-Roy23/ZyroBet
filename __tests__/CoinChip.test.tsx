import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CoinChip } from '../src/features/wallet/components/CoinChip';

// Mock reduced motion to be true during testing so animations run synchronously
jest.mock('../src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

describe('CoinChip Component', () => {
  test('renders formatted balance number', async () => {
    await render(<CoinChip balance={1250} />);
    expect(screen.getByText('1,250')).toBeTruthy();
  });

  test('renders compact format for large balance numbers', async () => {
    await render(<CoinChip balance={15000} />);
    expect(screen.getByText('15K')).toBeTruthy();
  });

  test('renders accessibility label with full formatted balance', async () => {
    await render(<CoinChip balance={125000} />);
    const button = screen.getByLabelText(
      'Virtual Balance: 125,000 coins. Tap to view transaction history.',
    );
    expect(button).toBeTruthy();
  });

  test('triggers custom onPress callback when tapped', async () => {
    const onPressMock = jest.fn();
    await render(<CoinChip balance={500} onPress={onPressMock} />);

    const button = screen.getByRole('button');
    fireEvent.press(button);

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});

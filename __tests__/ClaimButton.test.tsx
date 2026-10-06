import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ClaimButton } from '../src/features/rewards/components/ClaimButton';

describe('ClaimButton Component', () => {
  test('renders claimable button with coin amount and triggers onPress', async () => {
    const onPressMock = jest.fn();
    await render(
      <ClaimButton
        canClaim={true}
        coins={150}
        isLoading={false}
        onPress={onPressMock}
      />,
    );

    expect(screen.getByText('Claim 150 Free Coins')).toBeTruthy();

    const button = screen.getByRole('button');
    fireEvent.press(button);

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  test('blocks double press and renders spinner when loading', async () => {
    const onPressMock = jest.fn();
    await render(
      <ClaimButton
        canClaim={true}
        coins={150}
        isLoading={true}
        onPress={onPressMock}
      />,
    );

    expect(screen.getByText('Claiming your reward...')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('renders countdown message when reward is already claimed', async () => {
    const onPressMock = jest.fn();
    const nextClaimAt = new Date(Date.now() + 3600 * 1000 * 5).toISOString();

    await render(
      <ClaimButton
        canClaim={false}
        coins={150}
        isLoading={false}
        nextClaimAt={nextClaimAt}
        onPress={onPressMock}
      />,
    );

    expect(screen.getByText('REWARD CLAIMED FOR TODAY')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

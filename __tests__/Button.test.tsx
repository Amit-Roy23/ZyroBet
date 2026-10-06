import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '../src/components/ui/Button';

describe('Button component', () => {
  test('renders title correctly', async () => {
    await render(<Button title="Play Now" onPress={() => {}} />);
    expect(screen.getByText('Play Now')).toBeTruthy();
  });

  test('calls onPress when clicked', async () => {
    const onPressMock = jest.fn();
    await render(<Button title="Click Me" onPress={onPressMock} />);
    fireEvent.press(screen.getByText('Click Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  test('does not call onPress when disabled', async () => {
    const onPressMock = jest.fn();
    await render(<Button title="Disabled" onPress={onPressMock} disabled />);
    fireEvent.press(screen.getByText('Disabled'));
    expect(onPressMock).not.toHaveBeenCalled();
  });
});

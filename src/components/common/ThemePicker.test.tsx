// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemePicker } from '@/components/common/ThemePicker';

describe('ThemePicker', () => {
  it('renders the theme picker button', () => {
    render(<ThemePicker />);
    expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument();
  });

  it('displays the current theme name', () => {
    render(<ThemePicker />);
    expect(screen.getByText('Light')).toBeInTheDocument();
  });
});

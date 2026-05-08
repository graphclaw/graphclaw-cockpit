// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
export const mockMembers = [
  {
    user_id: 'Alice Chen',
    email: 'alice.chen@example.com',
    role: 'MEMBER',
    member_status: 'ACTIVE',
    joined_at: '2026-01-01T00:00:00Z',
  },
  {
    user_id: 'Bob Kumar',
    email: 'bob.kumar@example.com',
    role: 'MEMBER',
    member_status: 'ACTIVE',
    joined_at: '2026-01-02T00:00:00Z',
  },
  {
    user_id: 'Dave Smith',
    email: 'dave.smith@example.com',
    role: 'ADMIN',
    member_status: 'INVITED',
    joined_at: '2026-01-03T00:00:00Z',
  },
] as const;

export const mockCurrentUser = {
  user_id: 'USER-dev-001',
  token_type: 'access',
};

export const mockDevToken = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  expires_in: 900,
  user_id: 'USER-dev-001',
  role: 'ADMIN',
};

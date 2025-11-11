import type { AxiosResponse } from 'axios';

// Mock implementation of the authAPI for testing
export const mockAuthAPI = {
  verifyPin: async ({ email, pin }: { email: string; pin: string }): Promise<AxiosResponse> => {
    console.log('Mock verifyPin called with:', { email, pin });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful response
    if (pin === '123456') {
      return {
        data: {
          verified: true,
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: 'mock-user-id',
            email: email,
            name: 'Test User',
            hasBankConnected: false,
            onboardingComplete: false,
            hasWebAuthn: false
          },
          onboardingComplete: false,
          nextStep: 'bank_connection'
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      } as AxiosResponse;
    } else {
      // Mock error response
      throw {
        response: {
          data: { error: 'Incorrect PIN' },
          status: 401,
          statusText: 'Unauthorized'
        }
      };
    }
  }
};

// Use this in place of the real authAPI for testing
// In your test setup, you can do: jest.mock('../utils/api', () => ({ authAPI: mockAuthAPI }));

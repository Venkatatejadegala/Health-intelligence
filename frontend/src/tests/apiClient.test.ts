import { describe, it, expect, beforeEach, vi } from 'vitest';
import apiClient from '../services/apiClient';

describe('apiClient request interceptor', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });
  });

  it('should not add Authorization header if no token is in localStorage', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    const config = { url: '/api/logs/today', headers: {} as any };
    
    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const resolvedConfig = interceptor(config);
    
    expect(resolvedConfig.headers.Authorization).toBeUndefined();
  });

  it('should add Authorization header for relative requests if token is present', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue('mock-jwt-token');
    const config = { url: '/api/logs/today', headers: {} as any };
    
    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const resolvedConfig = interceptor(config);
    
    expect(resolvedConfig.headers.Authorization).toBe('Bearer mock-jwt-token');
  });

  it('should not add Authorization header for absolute external URL requests', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue('mock-jwt-token');
    const config = { url: 'https://generativelanguage.googleapis.com/v1beta/models', headers: {} as any };
    
    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const resolvedConfig = interceptor(config);
    
    expect(resolvedConfig.headers.Authorization).toBeUndefined();
  });
});

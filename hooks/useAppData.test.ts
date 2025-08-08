import { renderHook, waitFor } from '@testing-library/react';
import { useAppData } from './useAppData';
import backendApi from '../services/backendApi';
import { MOCK_APP_DATA } from '../constants';
import { AppData } from '../types';

// Mock the backendApi
jest.mock('../services/backendApi');
const mockedBackendApi = backendApi as jest.Mocked<typeof backendApi>;

describe('useAppData', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    mockedBackendApi.appData.getAppData.mockClear();
    mockLogout.mockClear();
  });

  it('should fetch data for an authenticated user', async () => {
    const mockData: AppData = { ...MOCK_APP_DATA, profile: { ...MOCK_APP_DATA.profile, name: 'Test User' } };
    mockedBackendApi.appData.getAppData.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useAppData({ isAuthenticated: true, loggedInUsername: 'testuser', logout: mockLogout }));

    expect(result.current[1]).toBe(true); // loading is true

    await waitFor(() => {
      expect(result.current[1]).toBe(false);
    });

    expect(result.current[0]).toEqual(mockData);
    expect(mockedBackendApi.appData.getAppData).toHaveBeenCalledWith('testuser');
  });

  it('should return mock data for an unauthenticated user', () => {
    const { result } = renderHook(() => useAppData({ isAuthenticated: false, loggedInUsername: null, logout: mockLogout }));

    expect(result.current[0]).toEqual(MOCK_APP_DATA);
    expect(result.current[1]).toBe(false);
  });
});

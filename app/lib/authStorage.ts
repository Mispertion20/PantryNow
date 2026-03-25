import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersonalizationSurvey } from '../db/types';

const TOKEN_KEY = 'pantrynow_auth_token';
const USER_KEY = 'pantrynow_auth_user';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar_data?: string;
  custom_instructions?: string;
  survey_completed?: boolean;
  personalization_survey?: PersonalizationSurvey | null;
};

export const saveAuthSession = async (token: string, user: AuthUser): Promise<void> => {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
};

export const getAuthToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(TOKEN_KEY);
};

export const getAuthUser = async (): Promise<AuthUser | null> => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const clearAuthSession = async (): Promise<void> => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};

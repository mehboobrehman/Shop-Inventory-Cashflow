import * as SecureStore from 'expo-secure-store';
import { User } from '../types/auth';

const KEYS = {
  TOKEN: 'shop_companion_auth_token',
  USER: 'shop_companion_auth_user',
  SERVER_URL: 'shop_companion_server_url',
} as const;

export const saveToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(KEYS.TOKEN, token);
  } catch (error) {
    console.error('Error saving auth token to SecureStore:', error);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(KEYS.TOKEN);
  } catch (error) {
    console.error('Error getting auth token from SecureStore:', error);
    return null;
  }
};

export const deleteToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(KEYS.TOKEN);
  } catch (error) {
    console.error('Error deleting auth token from SecureStore:', error);
  }
};

export const saveUser = async (user: User): Promise<void> => {
  try {
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user data to SecureStore:', error);
  }
};

export const getUser = async (): Promise<User | null> => {
  try {
    const data = await SecureStore.getItemAsync(KEYS.USER);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data from SecureStore:', error);
    return null;
  }
};

export const deleteUser = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(KEYS.USER);
  } catch (error) {
    console.error('Error deleting user data from SecureStore:', error);
  }
};

export const saveServerUrl = async (url: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(KEYS.SERVER_URL, url);
  } catch (error) {
    console.error('Error saving server URL to SecureStore:', error);
  }
};

export const getServerUrl = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(KEYS.SERVER_URL);
  } catch (error) {
    console.error('Error getting server URL from SecureStore:', error);
    return null;
  }
};

export const deleteServerUrl = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(KEYS.SERVER_URL);
  } catch (error) {
    console.error('Error deleting server URL from SecureStore:', error);
  }
};

export const clearAuth = async (): Promise<void> => {
  await Promise.all([deleteToken(), deleteUser()]);
};

export default {
  saveToken,
  getToken,
  deleteToken,
  saveUser,
  getUser,
  deleteUser,
  saveServerUrl,
  getServerUrl,
  deleteServerUrl,
  clearAuth,
};

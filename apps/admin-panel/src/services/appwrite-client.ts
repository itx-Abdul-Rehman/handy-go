/**
 * Appwrite SDK client for the Admin Panel.
 *
 * Replaces the Axios API client. Provides all Appwrite services
 * needed by admin pages (databases, account, functions, realtime).
 */
import { Client, Account, Databases, Functions, Storage } from 'appwrite';
import { appwriteConfig } from './appwrite-config';

const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);
export const storage = new Storage(client);
export { client };

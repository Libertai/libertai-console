// This file is auto-generated by @hey-api/openapi-ts

import type { Options as ClientOptions, TDataShape, Client } from '@hey-api/client-axios';
import type { GetAuthMessageAuthMessagePostData, GetAuthMessageAuthMessagePostResponse, GetAuthMessageAuthMessagePostError, LoginWithWalletAuthLoginPostData, LoginWithWalletAuthLoginPostResponse, LoginWithWalletAuthLoginPostError, CheckAuthStatusAuthStatusGetData, CheckAuthStatusAuthStatusGetResponse, CheckAuthStatusAuthStatusGetError, ProcessLtaiTransactionsCreditsLtaiProcessPostData, ProcessLtaiTransactionsCreditsLtaiProcessPostResponse, ThirdwebWebhookCreditsThirdwebWebhookPostData, ThirdwebWebhookCreditsThirdwebWebhookPostError, UpdateExpiredCreditTransactionsCreditsUpdateExpiredPostData, UpdateExpiredCreditTransactionsCreditsUpdateExpiredPostResponse, GetUserBalanceCreditsBalanceGetData, GetUserBalanceCreditsBalanceGetResponse, GetUserBalanceCreditsBalanceGetError, GetApiKeysApiKeysGetData, GetApiKeysApiKeysGetResponse, GetApiKeysApiKeysGetError, CreateApiKeyApiKeysPostData, CreateApiKeyApiKeysPostResponse, CreateApiKeyApiKeysPostError, DeleteApiKeyApiKeysKeyIdDeleteData, DeleteApiKeyApiKeysKeyIdDeleteError, UpdateApiKeyApiKeysKeyIdPutData, UpdateApiKeyApiKeysKeyIdPutResponse, UpdateApiKeyApiKeysKeyIdPutError, RegisterInferenceCallApiKeysAdminUsagePostData, RegisterInferenceCallApiKeysAdminUsagePostError, GetAdminAllApiKeysApiKeysAdminListGetData, GetAdminAllApiKeysApiKeysAdminListGetResponse, GetAdminAllApiKeysApiKeysAdminListGetError, GetDashboardStatsStatsDashboardGetData, GetDashboardStatsStatsDashboardGetResponse, GetDashboardStatsStatsDashboardGetError, GetUsageStatsStatsUsageGetData, GetUsageStatsStatsUsageGetResponse, GetUsageStatsStatsUsageGetError } from './types.gen';
import { client as _heyApiClient } from './client.gen';

export type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean> = ClientOptions<TData, ThrowOnError> & {
    /**
     * You can provide a client instance returned by `createClient()` instead of
     * individual options. This might be also useful if you want to implement a
     * custom client.
     */
    client?: Client;
    /**
     * You can pass arbitrary values through the `meta` object. This can be
     * used to access values that aren't defined as part of the SDK function.
     */
    meta?: Record<string, unknown>;
};

/**
 * Get Auth Message
 * Get the static message for wallet signature authentication.
 */
export const getAuthMessageAuthMessagePost = <ThrowOnError extends boolean = false>(options: Options<GetAuthMessageAuthMessagePostData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<GetAuthMessageAuthMessagePostResponse, GetAuthMessageAuthMessagePostError, ThrowOnError>({
        url: '/auth/message',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Login With Wallet
 * Authenticate with a wallet signature.
 */
export const loginWithWalletAuthLoginPost = <ThrowOnError extends boolean = false>(options: Options<LoginWithWalletAuthLoginPostData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<LoginWithWalletAuthLoginPostResponse, LoginWithWalletAuthLoginPostError, ThrowOnError>({
        url: '/auth/login',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Check Auth Status
 * Check if the user is authenticated with a valid token.
 */
export const checkAuthStatusAuthStatusGet = <ThrowOnError extends boolean = false>(options?: Options<CheckAuthStatusAuthStatusGetData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<CheckAuthStatusAuthStatusGetResponse, CheckAuthStatusAuthStatusGetError, ThrowOnError>({
        url: '/auth/status',
        ...options
    });
};

/**
 * Process Ltai Transactions
 * Process credit purchase with $LTAI transactions
 */
export const processLtaiTransactionsCreditsLtaiProcessPost = <ThrowOnError extends boolean = false>(options?: Options<ProcessLtaiTransactionsCreditsLtaiProcessPostData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).post<ProcessLtaiTransactionsCreditsLtaiProcessPostResponse, unknown, ThrowOnError>({
        url: '/credits/ltai/process',
        ...options
    });
};

/**
 * Thirdweb Webhook
 * Receive webhooks from Thirdweb
 */
export const thirdwebWebhookCreditsThirdwebWebhookPost = <ThrowOnError extends boolean = false>(options: Options<ThirdwebWebhookCreditsThirdwebWebhookPostData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<unknown, ThirdwebWebhookCreditsThirdwebWebhookPostError, ThrowOnError>({
        url: '/credits/thirdweb/webhook',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Update Expired Credit Transactions
 * Deactivate credits with a past expiration date.
 */
export const updateExpiredCreditTransactionsCreditsUpdateExpiredPost = <ThrowOnError extends boolean = false>(options?: Options<UpdateExpiredCreditTransactionsCreditsUpdateExpiredPostData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).post<UpdateExpiredCreditTransactionsCreditsUpdateExpiredPostResponse, unknown, ThrowOnError>({
        url: '/credits/update-expired',
        ...options
    });
};

/**
 * Get User Balance
 * Get the current credit balance for authenticated user.
 */
export const getUserBalanceCreditsBalanceGet = <ThrowOnError extends boolean = false>(options?: Options<GetUserBalanceCreditsBalanceGetData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<GetUserBalanceCreditsBalanceGetResponse, GetUserBalanceCreditsBalanceGetError, ThrowOnError>({
        url: '/credits/balance',
        ...options
    });
};

/**
 * Get Api Keys
 * Get all API keys for a user.
 */
export const getApiKeysApiKeysGet = <ThrowOnError extends boolean = false>(options?: Options<GetApiKeysApiKeysGetData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<GetApiKeysApiKeysGetResponse, GetApiKeysApiKeysGetError, ThrowOnError>({
        url: '/api-keys',
        ...options
    });
};

/**
 * Create Api Key
 * Create a new API key for a user.
 */
export const createApiKeyApiKeysPost = <ThrowOnError extends boolean = false>(options: Options<CreateApiKeyApiKeysPostData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<CreateApiKeyApiKeysPostResponse, CreateApiKeyApiKeysPostError, ThrowOnError>({
        url: '/api-keys',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Delete Api Key
 * Delete an API key.
 */
export const deleteApiKeyApiKeysKeyIdDelete = <ThrowOnError extends boolean = false>(options: Options<DeleteApiKeyApiKeysKeyIdDeleteData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).delete<unknown, DeleteApiKeyApiKeysKeyIdDeleteError, ThrowOnError>({
        url: '/api-keys/{key_id}',
        ...options
    });
};

/**
 * Update Api Key
 * Update an API key.
 */
export const updateApiKeyApiKeysKeyIdPut = <ThrowOnError extends boolean = false>(options: Options<UpdateApiKeyApiKeysKeyIdPutData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).put<UpdateApiKeyApiKeysKeyIdPutResponse, UpdateApiKeyApiKeysKeyIdPutError, ThrowOnError>({
        url: '/api-keys/{key_id}',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Register Inference Call
 * Log API key usage.
 *
 * This endpoint is protected by admin authorization and requires
 * the X-Admin-Token header to match the ADMIN_SECRET environment variable.
 */
export const registerInferenceCallApiKeysAdminUsagePost = <ThrowOnError extends boolean = false>(options: Options<RegisterInferenceCallApiKeysAdminUsagePostData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<unknown, RegisterInferenceCallApiKeysAdminUsagePostError, ThrowOnError>({
        url: '/api-keys/admin/usage',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Get Admin All Api Keys
 * Get all API keys across all addresses.
 *
 * This endpoint is protected by admin authorization and requires
 * the X-Admin-Token header to match the ADMIN_SECRET environment variable.
 */
export const getAdminAllApiKeysApiKeysAdminListGet = <ThrowOnError extends boolean = false>(options: Options<GetAdminAllApiKeysApiKeysAdminListGetData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetAdminAllApiKeysApiKeysAdminListGetResponse, GetAdminAllApiKeysApiKeysAdminListGetError, ThrowOnError>({
        url: '/api-keys/admin/list',
        ...options
    });
};

/**
 * Get Dashboard Stats
 * Get dashboard statistics for the authenticated user:
 * - Credits used per month for the last 6 months
 * - Number of inference calls made this month
 * - Tokens used this month (input, output, and total)
 */
export const getDashboardStatsStatsDashboardGet = <ThrowOnError extends boolean = false>(options?: Options<GetDashboardStatsStatsDashboardGetData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<GetDashboardStatsStatsDashboardGetResponse, GetDashboardStatsStatsDashboardGetError, ThrowOnError>({
        url: '/stats/dashboard',
        ...options
    });
};

/**
 * Get Usage Stats
 * Get detailed usage statistics for a specific date range.
 *
 * Statistics include:
 * - Total number of inference calls
 * - Total tokens (input and output)
 * - Total cost
 * - Daily breakdown of token usage
 * - Usage breakdown by model
 * - Usage breakdown by API key
 */
export const getUsageStatsStatsUsageGet = <ThrowOnError extends boolean = false>(options: Options<GetUsageStatsStatsUsageGetData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetUsageStatsStatsUsageGetResponse, GetUsageStatsStatsUsageGetError, ThrowOnError>({
        url: '/stats/usage',
        ...options
    });
};
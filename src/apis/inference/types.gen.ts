// This file is auto-generated by @hey-api/openapi-ts

export type ApiKey = {
    id: string;
    key: string;
    name: string;
    created_at: string;
    is_active: boolean;
    monthly_limit?: number | null;
};

export type ApiKeyCreate = {
    name: string;
    monthly_limit?: number | null;
};

export type ApiKeyListResponse = {
    keys: Array<ApiKey>;
};

export type ApiKeyUpdate = {
    name?: string | null;
    is_active?: boolean | null;
    monthly_limit?: number | null;
};

export type ApiKeyUsageLog = {
    key: string;
    credits_used: number;
};

export type AuthLoginRequest = {
    address: string;
    signature: string;
};

export type AuthLoginResponse = {
    access_token: string;
    token_type?: string;
    address: string;
};

export type AuthMessageRequest = {
    address: string;
};

export type AuthMessageResponse = {
    message: string;
};

export type ExpiredCreditTransaction = {
    transaction_hash: string;
    address: string;
    expired_at: string | null;
};

export type ExpiredCreditTransactionsResponse = {
    updated_count: number;
    transactions: Array<ExpiredCreditTransaction>;
};

export type FullApiKey = {
    id: string;
    key: string;
    name: string;
    created_at: string;
    is_active: boolean;
    monthly_limit?: number | null;
    full_key: string;
};

export type HttpValidationError = {
    detail?: Array<ValidationError>;
};

export type ThirdwebWebhookPayload = {
    data: {
        [key: string]: unknown;
    };
};

export type ValidationError = {
    loc: Array<string | number>;
    msg: string;
    type: string;
};

export type GetAuthMessageAuthMessagePostData = {
    body: AuthMessageRequest;
    path?: never;
    query?: never;
    url: '/auth/message';
};

export type GetAuthMessageAuthMessagePostErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type GetAuthMessageAuthMessagePostError = GetAuthMessageAuthMessagePostErrors[keyof GetAuthMessageAuthMessagePostErrors];

export type GetAuthMessageAuthMessagePostResponses = {
    /**
     * Successful Response
     */
    200: AuthMessageResponse;
};

export type GetAuthMessageAuthMessagePostResponse = GetAuthMessageAuthMessagePostResponses[keyof GetAuthMessageAuthMessagePostResponses];

export type LoginWithWalletAuthLoginPostData = {
    body: AuthLoginRequest;
    path?: never;
    query?: never;
    url: '/auth/login';
};

export type LoginWithWalletAuthLoginPostErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type LoginWithWalletAuthLoginPostError = LoginWithWalletAuthLoginPostErrors[keyof LoginWithWalletAuthLoginPostErrors];

export type LoginWithWalletAuthLoginPostResponses = {
    /**
     * Successful Response
     */
    200: AuthLoginResponse;
};

export type LoginWithWalletAuthLoginPostResponse = LoginWithWalletAuthLoginPostResponses[keyof LoginWithWalletAuthLoginPostResponses];

export type ProcessLtaiTransactionsCreditsLtaiProcessPostData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/credits/ltai/process';
};

export type ProcessLtaiTransactionsCreditsLtaiProcessPostResponses = {
    /**
     * Successful Response
     */
    200: Array<string>;
};

export type ProcessLtaiTransactionsCreditsLtaiProcessPostResponse = ProcessLtaiTransactionsCreditsLtaiProcessPostResponses[keyof ProcessLtaiTransactionsCreditsLtaiProcessPostResponses];

export type ThirdwebWebhookCreditsThirdwebWebhookPostData = {
    body: ThirdwebWebhookPayload;
    headers?: {
        'X-Pay-Signature'?: string;
        'X-Pay-Timestamp'?: string;
    };
    path?: never;
    query?: never;
    url: '/credits/thirdweb/webhook';
};

export type ThirdwebWebhookCreditsThirdwebWebhookPostErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type ThirdwebWebhookCreditsThirdwebWebhookPostError = ThirdwebWebhookCreditsThirdwebWebhookPostErrors[keyof ThirdwebWebhookCreditsThirdwebWebhookPostErrors];

export type ThirdwebWebhookCreditsThirdwebWebhookPostResponses = {
    /**
     * Successful Response
     */
    200: unknown;
};

export type UpdateExpiredCreditTransactionsCreditsUpdateExpiredPostData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/credits/update-expired';
};

export type UpdateExpiredCreditTransactionsCreditsUpdateExpiredPostResponses = {
    /**
     * Successful Response
     */
    200: ExpiredCreditTransactionsResponse;
};

export type UpdateExpiredCreditTransactionsCreditsUpdateExpiredPostResponse = UpdateExpiredCreditTransactionsCreditsUpdateExpiredPostResponses[keyof UpdateExpiredCreditTransactionsCreditsUpdateExpiredPostResponses];

export type GetApiKeysApiKeysAddressGetData = {
    body?: never;
    path: {
        address: string;
    };
    query?: never;
    url: '/api-keys/{address}';
};

export type GetApiKeysApiKeysAddressGetErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type GetApiKeysApiKeysAddressGetError = GetApiKeysApiKeysAddressGetErrors[keyof GetApiKeysApiKeysAddressGetErrors];

export type GetApiKeysApiKeysAddressGetResponses = {
    /**
     * Successful Response
     */
    200: ApiKeyListResponse;
};

export type GetApiKeysApiKeysAddressGetResponse = GetApiKeysApiKeysAddressGetResponses[keyof GetApiKeysApiKeysAddressGetResponses];

export type CreateApiKeyApiKeysAddressPostData = {
    body: ApiKeyCreate;
    path: {
        address: string;
    };
    query?: never;
    url: '/api-keys/{address}';
};

export type CreateApiKeyApiKeysAddressPostErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type CreateApiKeyApiKeysAddressPostError = CreateApiKeyApiKeysAddressPostErrors[keyof CreateApiKeyApiKeysAddressPostErrors];

export type CreateApiKeyApiKeysAddressPostResponses = {
    /**
     * Successful Response
     */
    200: FullApiKey;
};

export type CreateApiKeyApiKeysAddressPostResponse = CreateApiKeyApiKeysAddressPostResponses[keyof CreateApiKeyApiKeysAddressPostResponses];

export type DeleteApiKeyApiKeysIdKeyIdDeleteData = {
    body?: never;
    path: {
        key_id: string;
    };
    query?: never;
    url: '/api-keys/id/{key_id}';
};

export type DeleteApiKeyApiKeysIdKeyIdDeleteErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type DeleteApiKeyApiKeysIdKeyIdDeleteError = DeleteApiKeyApiKeysIdKeyIdDeleteErrors[keyof DeleteApiKeyApiKeysIdKeyIdDeleteErrors];

export type DeleteApiKeyApiKeysIdKeyIdDeleteResponses = {
    /**
     * Successful Response
     */
    200: unknown;
};

export type UpdateApiKeyApiKeysIdKeyIdPutData = {
    body: ApiKeyUpdate;
    path: {
        key_id: string;
    };
    query?: never;
    url: '/api-keys/id/{key_id}';
};

export type UpdateApiKeyApiKeysIdKeyIdPutErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type UpdateApiKeyApiKeysIdKeyIdPutError = UpdateApiKeyApiKeysIdKeyIdPutErrors[keyof UpdateApiKeyApiKeysIdKeyIdPutErrors];

export type UpdateApiKeyApiKeysIdKeyIdPutResponses = {
    /**
     * Successful Response
     */
    200: ApiKey;
};

export type UpdateApiKeyApiKeysIdKeyIdPutResponse = UpdateApiKeyApiKeysIdKeyIdPutResponses[keyof UpdateApiKeyApiKeysIdKeyIdPutResponses];

export type LogApiKeyUsageApiKeysUsagePostData = {
    body: ApiKeyUsageLog;
    path?: never;
    query?: never;
    url: '/api-keys/usage';
};

export type LogApiKeyUsageApiKeysUsagePostErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type LogApiKeyUsageApiKeysUsagePostError = LogApiKeyUsageApiKeysUsagePostErrors[keyof LogApiKeyUsageApiKeysUsagePostErrors];

export type LogApiKeyUsageApiKeysUsagePostResponses = {
    /**
     * Successful Response
     */
    200: unknown;
};

export type ClientOptions = {
    baseURL: 'http://localhost:8000' | (string & {});
};
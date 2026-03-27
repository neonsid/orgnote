/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bookmarks_helpers from "../bookmarks/helpers.js";
import type * as bookmarks_internal from "../bookmarks/internal.js";
import type * as bookmarks_mutations from "../bookmarks/mutations.js";
import type * as bookmarks_queries from "../bookmarks/queries.js";
import type * as groups_mutations from "../groups/mutations.js";
import type * as groups_queries from "../groups/queries.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_prompt from "../lib/prompt.js";
import type * as lib_scira from "../lib/scira.js";
import type * as lib_url_classifier from "../lib/url_classifier.js";
import type * as metadata from "../metadata.js";
import type * as metadata_ai_description from "../metadata/ai_description.js";
import type * as metadata_bookmark_description from "../metadata/bookmark_description.js";
import type * as metadata_github_fetch from "../metadata/github_fetch.js";
import type * as metadata_internal from "../metadata/internal.js";
import type * as metadata_open_graph from "../metadata/open_graph.js";
import type * as metadata_validators from "../metadata/validators.js";
import type * as migrations from "../migrations.js";
import type * as profile_mutations from "../profile/mutations.js";
import type * as profile_queries from "../profile/queries.js";
import type * as rate_limit from "../rate_limit.js";
import type * as safeBrowsing from "../safeBrowsing.js";
import type * as vault_mutations from "../vault/mutations.js";
import type * as vault_queries from "../vault/queries.js";
import type * as vault_node from "../vault_node.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "bookmarks/helpers": typeof bookmarks_helpers;
  "bookmarks/internal": typeof bookmarks_internal;
  "bookmarks/mutations": typeof bookmarks_mutations;
  "bookmarks/queries": typeof bookmarks_queries;
  "groups/mutations": typeof groups_mutations;
  "groups/queries": typeof groups_queries;
  "lib/auth": typeof lib_auth;
  "lib/constants": typeof lib_constants;
  "lib/prompt": typeof lib_prompt;
  "lib/scira": typeof lib_scira;
  "lib/url_classifier": typeof lib_url_classifier;
  metadata: typeof metadata;
  "metadata/ai_description": typeof metadata_ai_description;
  "metadata/bookmark_description": typeof metadata_bookmark_description;
  "metadata/github_fetch": typeof metadata_github_fetch;
  "metadata/internal": typeof metadata_internal;
  "metadata/open_graph": typeof metadata_open_graph;
  "metadata/validators": typeof metadata_validators;
  migrations: typeof migrations;
  "profile/mutations": typeof profile_mutations;
  "profile/queries": typeof profile_queries;
  rate_limit: typeof rate_limit;
  safeBrowsing: typeof safeBrowsing;
  "vault/mutations": typeof vault_mutations;
  "vault/queries": typeof vault_queries;
  vault_node: typeof vault_node;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: {
    lib: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
      getValue: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          key?: string;
          name: string;
          sampleShards?: number;
        },
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          shard: number;
          ts: number;
          value: number;
        }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
    time: {
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
    };
  };
};

import { ApolloServerErrorCode } from '@apollo/server/errors';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { GraphQLFormattedError } from 'graphql';

const CODE_BY_STATUS: Partial<Record<HttpStatus, string>> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHENTICATED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
};

/**
 * Maps Nest HTTP exceptions thrown by services to GraphQL error codes, so
 * services stay transport-agnostic. In production, messages of unexpected
 * errors are hidden: they may contain SQL or other internals.
 */
export function createFormatError(isProduction: boolean) {
  return (
    formatted: GraphQLFormattedError,
    error: unknown,
  ): GraphQLFormattedError => {
    // Duck-typed instead of Apollo's unwrapResolverError: graphql@16 ships
    // both CJS and ESM builds, and `instanceof GraphQLError` fails when the
    // two get loaded side by side (as happens under vitest).
    const original =
      (error as { originalError?: unknown } | null)?.originalError ?? error;

    if (original instanceof HttpException) {
      // Nest adds these HTTP details on top of the code; they duplicate it.
      const {
        originalError: _originalError,
        status: _status,
        ...extensions
      } = formatted.extensions ?? {};

      return {
        ...formatted,
        extensions: {
          ...extensions,
          code:
            CODE_BY_STATUS[original.getStatus() as HttpStatus] ??
            extensions.code,
        },
      };
    }

    if (
      isProduction &&
      formatted.extensions?.code === ApolloServerErrorCode.INTERNAL_SERVER_ERROR
    ) {
      return {
        message: 'Internal server error',
        path: formatted.path,
        extensions: { code: ApolloServerErrorCode.INTERNAL_SERVER_ERROR },
      };
    }

    return formatted;
  };
}

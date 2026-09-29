import { NotFoundException } from '@nestjs/common';
import { GraphQLError, type GraphQLFormattedError } from 'graphql';
import { describe, expect, it } from 'vitest';
import { createFormatError } from './format-error.js';

// Apollo passes resolver errors wrapped in a GraphQLError with a path.
const wrap = (originalError: Error) =>
  new GraphQLError(originalError.message, {
    originalError,
    path: ['profile'],
  });

const internal: GraphQLFormattedError = {
  message: 'relation "profiles" does not exist',
  path: ['profile'],
  extensions: { code: 'INTERNAL_SERVER_ERROR', stacktrace: ['...'] },
};

describe('createFormatError', () => {
  it('maps Nest HTTP exceptions to GraphQL codes and drops HTTP details', () => {
    const formatted: GraphQLFormattedError = {
      message: 'Profile "nope" not found',
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        status: 404,
        originalError: { statusCode: 404 },
      },
    };

    const result = createFormatError(true)(
      formatted,
      wrap(new NotFoundException('Profile "nope" not found')),
    );

    expect(result).toEqual({
      message: 'Profile "nope" not found',
      extensions: { code: 'NOT_FOUND' },
    });
  });

  it('hides unexpected error details in production', () => {
    const result = createFormatError(true)(internal, wrap(new Error('boom')));

    expect(result).toEqual({
      message: 'Internal server error',
      path: ['profile'],
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  });

  it('keeps unexpected error details outside production', () => {
    const result = createFormatError(false)(internal, wrap(new Error('boom')));

    expect(result).toBe(internal);
  });

  it('passes GraphQL validation errors through', () => {
    const validation: GraphQLFormattedError = {
      message: 'Cannot query field "links" on type "Profile".',
      extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
    };

    const result = createFormatError(true)(
      validation,
      new GraphQLError(validation.message),
    );

    expect(result).toBe(validation);
  });
});

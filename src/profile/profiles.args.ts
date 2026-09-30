import { ArgsType, Field, Int } from '@nestjs/graphql';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './profile.constants.js';

@ArgsType()
export class ProfilesArgs {
  @Field(() => Int, {
    defaultValue: DEFAULT_PAGE_SIZE,
    description: `Page size, from 1 to ${MAX_PAGE_SIZE}`,
  })
  first: number;

  @Field(() => String, {
    nullable: true,
    description: 'endCursor of the previous page; omit for the first page',
  })
  after?: string | null;
}

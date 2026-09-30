import { Field, ObjectType } from '@nestjs/graphql';
import { ProfileModel } from './profile.model.js';

@ObjectType('PageInfo')
export class PageInfoModel {
  @Field({ description: 'Whether more items follow endCursor' })
  hasNextPage: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'Pass as `after` to get the next page; null for an empty page',
  })
  endCursor: string | null;
}

@ObjectType('ProfileConnection')
export class ProfileConnectionModel {
  @Field(() => [ProfileModel])
  nodes: ProfileModel[];

  @Field(() => PageInfoModel)
  pageInfo: PageInfoModel;
}

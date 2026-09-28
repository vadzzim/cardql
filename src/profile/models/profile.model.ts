import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('Profile')
export class ProfileModel {
  @Field(() => ID)
  id: string;

  @Field()
  slug: string;

  @Field()
  name: string;

  @Field()
  headline: string;

  @Field()
  description: string;

  @Field(() => String, { nullable: true })
  location: string | null;

  @Field(() => String, { nullable: true })
  email: string | null;
}

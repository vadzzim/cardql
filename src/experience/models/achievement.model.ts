import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('Achievement')
export class AchievementModel {
  @Field(() => ID)
  id: string;

  @Field()
  description: string;
}

import { Field, ID, ObjectType } from '@nestjs/graphql';

// startDate, endDate and achievements are resolved by ExperienceResolver.
@ObjectType('Experience')
export class ExperienceModel {
  @Field(() => ID)
  id: string;

  @Field()
  company: string;

  @Field({ description: 'Job title' })
  position: string;
}

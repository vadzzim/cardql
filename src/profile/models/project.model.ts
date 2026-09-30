import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('Project')
export class ProjectModel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ description: 'Project page or repository' })
  url: string;
}

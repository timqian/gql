/* @flow */
import { GraphQLError } from 'graphql/error';

export function NoSchemaDefinition(context: any): any {
  return {
    Definition: {
      // Validate on leave to allow for deeper errors to appear first.
      enter(node) {
        node.definitions.forEach(definition => {
          if (
            definition.kind !== 'OperationDefinition' ||
            definition.kind !== 'FragmentDefinition'
          ) {
            context.reportError(
              new GraphQLError(
                'Only fragment, mutation, query or subscription allowed',
                [node],
              ),
            );
          }
        });
      },
    },
  };
}

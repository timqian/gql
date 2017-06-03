/* @flow */
import { GraphQLError } from 'graphql/error';

export function ExactlyOneOperationPerTag(context: any): any {
  return {
    Document: {
      // Validate on leave to allow for deeper errors to appear first.
      enter(node) {
        const [mainDefinition] = node.definitions;
        if (mainDefinition.kind === 'OperationDefinition') {
          if (node.definitions.length !== 1) {
            context.reportError(
              new GraphQLError(
                'Expected exactly one operation (query, mutation or subscription)',
                [node],
              ),
            );
          }
        }
      },
    },
  };
}

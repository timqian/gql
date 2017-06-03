/* @flow */
import { type DocumentNode } from 'graphql/language/ast';
import { type GQLSchema } from './GQLTypes';
import { toGQLError, type GQLError } from './GQLError';
import { type ValidateConfigResolved } from 'gql-config/types';

import { ValidationContext } from 'graphql/validation/validate';
import { TypeInfo } from 'graphql/utilities/TypeInfo';
import {
  visit,
  visitInParallel,
  visitWithTypeInfo,
} from 'graphql/language/visitor';

const makeRuleContext = (context, rule, config) =>
  new Proxy(context, {
    get(target, key) {
      if (key === 'reportError') {
        return error => {
          error.message = `${error.message} (${rule.name})`;
          // $FlowDisableNextLine
          target[key](toGQLError(error, config[rule.name]));
        };
      }
      // $FlowDisableNextLine
      return target[key];
    },
  });

export default function validate(
  schema: GQLSchema,
  ast: DocumentNode,
  validateConfig: ValidateConfigResolved,
): Array<GQLError> {
  const _schema: any = schema;

  if (validateConfig.rules.length === 0) {
    return [];
  }

  const typeInfo = new TypeInfo(_schema);
  const context = new ValidationContext(_schema, ast, typeInfo);
  const visitors = validateConfig.rules.map(rule =>
    rule(makeRuleContext(context, rule, validateConfig.config)),
  );
  visit(ast, visitWithTypeInfo(typeInfo, visitInParallel(visitors)));
  return (context.getErrors(): any);
}

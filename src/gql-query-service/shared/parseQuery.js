/* @flow */
import { Source } from 'graphql/language/source';
import { type DocumentNode } from 'graphql/language/ast';
import { parse as parseGraphqlDocument } from 'graphql/language/parser';
import { type IParser } from 'gql-shared/types';
import { toGQLError, type GQLError, SEVERITY } from 'gql-shared/GQLError';
import toQueryDocument from './toQueryDocument';

export type ParsedQuery = {|
  queries: Array<{|
    ast: ?DocumentNode,
    error: ?GQLError,
    sourceText: string,
  |}>,
  isEmpty: boolean,
|};

export default function parserQuery(
  source: Source,
  parser: IParser,
): ParsedQuery {
  const queryDocuments = toQueryDocument(source, parser);
  return {
    isEmpty: queryDocuments.length === 0,
    queries: queryDocuments.map(doc => {
      try {
        const ast = parseGraphqlDocument(new Source(doc, source.name));
        return {
          ast,
          error: null,
          sourceText: doc,
        };
      } catch (err) {
        return {
          ast: null,
          error: toGQLError(err, SEVERITY.error),
          sourceText: doc,
        };
      }
    }),
  };
}

/* @flow */
import {
  type GQLPosition,
  type GQLLocation,
  type IParser,
} from 'gql-shared/types';
import { type GQLSchema } from 'gql-shared/GQLTypes';
import getTokenAtPosition from 'gql-shared/getTokenAtPosition';
import getDefLocationForNode from 'gql-shared/getDefLocationForNode';

// import printTokenState from 'gql-shared/printTokenState';

export default function findRefsOfTokenAtPosition({
  schema,
  sourceText,
  position,
  parser,
}: {
  schema: GQLSchema,
  sourceText: string,
  position: GQLPosition,
  parser: IParser,
}): Array<GQLLocation> {
  // console.log('getDef', sourceText, position);
  // console.time('getDef');
  // console.time('getTokenAtPosition');
  const token = getTokenAtPosition(parser, sourceText, position);
  // console.timeEnd('getTokenAtPosition');
  // console.log('token', token);
  if (!token) {
    return [];
  }

  const { state } = token;

  if (
    state.kind.endsWith('Def') ||
    state.kind === 'NamedType' ||
    (state.kind === 'UnionMember' && state.step === 1) || // union Type = Type1 | Type2<------
    (state.kind === 'Implements' && state.step === 1)
  ) {
    const { name } = state;
    const type = schema.getType(name);
    if (type) {
      const locations = type.dependents
        .concat(type.node && type.node.name) // include definition also
        .map(getDefLocationForNode)
        .filter(defLocation => Boolean(defLocation));
      // 'any' Flow not able to detect we are filtering nul values
      return (locations: any);
    }
  }
  return [];
}

/* @flow */
/* eslint-disable complexity */
import { getNamedType, type GQLSchema } from 'gql-shared/GQLTypes';
import getTokenAtPosition from 'gql-shared/getTokenAtPosition';
import debug from 'gql-shared/debug';
import { type GQLPosition, type GQLInfo, type IParser } from 'gql-shared/types';
import getTypeInfo from '../shared/getTypeInfo';

export default function getInfoOfTokenAtPosition({
  schema,
  sourceText,
  position,
  parser,
}: {
  schema: GQLSchema,
  sourceText: string,
  position: GQLPosition,
  parser: IParser,
}): ?GQLInfo {
  // console.log('getDef', sourceText, position);
  debug.time('getTokenAtPosition');
  const token = getTokenAtPosition(parser, sourceText, position);
  debug.timeEnd('getTokenAtPosition');

  if (!token) {
    return null;
  }

  const { state } = token;
  const { kind, step } = state;
  const typeInfo = getTypeInfo(schema, state);

  // console.log(kind, step, typeInfo, 'state\n\n', state);

  if (
    (kind === 'NamedType' && step === 0) ||
    (kind === 'TypeCondition' && step === 1) || // fragment on TypeName <----
    (kind === 'Mutation' && step === 0) || // ----> mutation { }
    (kind === 'Query' && step === 0) // ----> query xyz { xyz }
  ) {
    if (typeInfo.type) {
      const type = getNamedType(typeInfo.type);
      if (type) {
        return { contents: [type.print()] };
      }
    }
    return null;
  }

  if (kind === 'Field' || kind === 'AliasedField') {
    if (!typeInfo.fieldDef) {
      return null;
    }
    const { fieldDef } = typeInfo;
    const contents = [];

    contents.push(fieldDef.print());

    if (typeInfo.parentType && typeInfo.parentType.name === 'Mutation') {
      // include input args type
      fieldDef.args.forEach(arg => {
        const argType = getNamedType(arg.type);
        if (argType) {
          contents.push(argType.print());
        }
      });
    }

    // include type full definition
    const type = getNamedType(fieldDef.type);
    if (type) {
      contents.push(type.print());
    }

    return { contents };
  }

  if (kind === 'Argument') {
    const { argDef } = typeInfo;
    if (argDef) {
      const contents = [];
      contents.push(argDef.print());
      const type = getNamedType(argDef.type);
      if (type) {
        contents.push(type.print());
      }

      return { contents };
    }
  }

  if (kind === 'ObjectField') {
    if (typeInfo.objectFieldDefs) {
      const objectField = typeInfo.objectFieldDef;
      const contents = [];
      if (objectField) {
        contents.push(objectField.print());
        const type = getNamedType(objectField.type);
        if (type) {
          contents.push(type.print());
        }
      }
      return { contents };
    }
  }

  if (kind === 'Directive' && step === 1) {
    if (typeInfo.directiveDef) {
      return {
        contents: [typeInfo.directiveDef.print()],
      };
    }
  }

  return null;
}

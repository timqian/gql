/* @flow */
import findRefsOfTokenAtPosition from '../findRefsOfTokenAtPosition';

import { getRefLocations, getSchema } from 'gql-test-utils/test-data';
import code from 'gql-test-utils/code';
import { schemaParser } from 'gql-test-utils/parsers';

const refLocations = getRefLocations();
let schema = null;
beforeAll(async () => {
  schema = await getSchema();
});
const findRefs = (sourceText, position) => {
  return findRefsOfTokenAtPosition({
    schema,
    sourceText,
    position,
    parser: schemaParser(),
  });
};

test('field type: ObjectType', () => {
  const { sourceText, position } = code(`
    type Test {
      field: Player,
      #--------^
    }
  `);
  expect(findRefs(sourceText, position)).toEqual(refLocations.Player);
});

test('field type: Enum', () => {
  const { sourceText, position } = code(`
    type Test {
      field: Role,
      #-------^
    }
  `);
  expect(findRefs(sourceText, position)).toEqual(refLocations.Role);
});

test('field type: CustomScalar', () => {
  const { sourceText, position } = code(`
    type Test {
      field: CustomScalar,
          #------^
    }
  `);
  expect(findRefs(sourceText, position)).toEqual(refLocations.CustomScalar);
});

test('union type', () => {
  const { sourceText, position } = code(`
    union Test = Player | Node;
          ----------^
  `);
  expect(findRefs(sourceText, position)).toEqual(refLocations.Player);
});

test('arguments', () => {
  const { sourceText, position } = code(`
    type Test {
      test(a: CustomScalar): string
        #----------^
    }
  `);
  expect(findRefs(sourceText, position)).toEqual(refLocations.CustomScalar);
});

test('implements', () => {
  const { sourceText, position } = code(`
    type Test implements Edge {
                  #-------^
      test: string
    }
  `);
  expect(findRefs(sourceText, position)).toEqual(refLocations.Edge);
});

test('unknown types', () => {
  const { sourceText, position } = code(`
    type Test implements xEdge {
                  #-------^
      test: string
    }
  `);
  expect(findRefs(sourceText, position)).toEqual([]);
});

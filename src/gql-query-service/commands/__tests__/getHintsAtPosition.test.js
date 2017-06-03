/* @flow */
import getHintsAtPosition from '../getHintsAtPosition';
import { getHints, getSchema } from 'gql-test-utils/test-data';
import code from 'gql-test-utils/code';

import {
  relayQLParser,
  queryParser,
  relayExtendSchema,
} from 'gql-test-utils/parsers';

const hints = getHints();
let schema = null;
beforeAll(async () => {
  schema = await getSchema();
});

describe('fragments', () => {
  it('on Type suggestions', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on   #
          ---------------^
      \`;
    `);

    expect(
      getHintsAtPosition({
        schema,
        sourceText,
        position,
        parser: relayQLParser(),
      }),
    ).toEqual(hints.CompositeTypes);
  });

  it('on Type suggestions after few characters', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Pl  #
          ----------------^
      \`;
    `);

    expect(
      getHintsAtPosition({
        schema,
        sourceText,
        position,
        parser: relayQLParser(),
      }),
    ).toEqual(hints.CompositeTypes);
  });

  it('fields suggestions: Simple', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
                #
         #---^
        }
      \`;
    `);

    expect(
      getHintsAtPosition({
        schema,
        sourceText,
        position,
        parser: relayQLParser(),
      }),
    ).toEqual(hints.PlayerTypeFields);
  });

  it('alias fields', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
          some:    #
          ------^
        }
      \`;
    `);

    expect(
      getHintsAtPosition({
        schema,
        sourceText,
        position,
        parser: relayQLParser(),
      }),
    ).toEqual(hints.PlayerTypeFields);
  });

  it('[Relay] fields after interpolation', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
          id
          \${Component.getFragment('player')}
                 #
          #---^
        }
      \`;
    `);

    expect(
      getHintsAtPosition({
        schema,
        sourceText,
        position,
        parser: relayQLParser(),
      }),
    ).toEqual(hints.PlayerTypeFields);
  });

  it('fields args', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Player {
          image()
          ------^
        }
      \`;
    `);
    expect(
      getHintsAtPosition({
        schema,
        sourceText,
        position,
        parser: relayQLParser(),
      }),
    ).toEqual(hints.PlayerTypeImageFieldArgs);
  });

  it('inline fragments on Type', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Node {
          id
          ...on   #
          ------^
        }
      \`;
    `);
    expect(
      getHintsAtPosition({
        schema,
        sourceText,
        position,
        parser: relayQLParser(),
      }),
    ).toEqual(hints.TypesImplementsNode);
  });

  it('inline fragments on Type fields', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment test on Node {
          id
          ...on Player {
                #
           #--^
          }
        }
      \`;
    `);
    expect(
      getHintsAtPosition({
        schema,
        sourceText,
        position,
        parser: relayQLParser(),
      }),
    ).toEqual(hints.PlayerTypeFields);
  });
});

describe('mutation', () => {
  it('fields', () => {
    const { sourceText, position } = code(`
      Relay.QL\`
        mutation { }
        ----------^
      \`;
    `);
    expect(
      getHintsAtPosition({
        schema,
        sourceText,
        position,
        parser: relayQLParser(),
      }),
    ).toEqual(hints.PossibleMutations);
  });

  it('field args', () => {
    const { sourceText, position } = code(`
      mutation {
        PlayerCreate()
        -------------^
      }
    `);
    expect(
      getHintsAtPosition({
        schema,
        sourceText,
        position,
        parser: queryParser(),
      }),
    ).toMatchSnapshot();
  });
});

describe('Values', () => {
  it('enum value suggesstion', () => {
    const { sourceText, position } = code(`
      fragment test on NewPlayer {
        image(role: )
        #----------^
      }
    `);
    expect(
      getHintsAtPosition({
        schema,
        sourceText,
        position,
        parser: queryParser(),
      }),
    ).toEqual(hints.EnumRoleValues);
  });

  it('Object value keys', () => {
    const { sourceText, position } = code(`
      mutation {
        PlayerCreate(
          input: {
            id: "string",
              #
        #---^
          }
        })
      }
    `);
    expect(
      getHintsAtPosition({
        schema,
        sourceText,
        position,
        parser: queryParser(),
      }),
    ).toMatchSnapshot();
  });
});

describe('query', () => {
  it('fields', () => {
    const { sourceText, position } = code(`
      Relay.QL\`
        query Test { }
        ------------^
      \`;
    `);
    expect(
      getHintsAtPosition({
        schema,
        sourceText,
        position,
        parser: relayQLParser(),
      }),
    ).toEqual(hints.QueryFields);
  });
});

describe('directives', () => {
  it('directives', () => {
    const { sourceText, position } = code(`
      fragment on Test {
        id @inc
      --------^
      }
    `);
    expect(
      getHintsAtPosition({
        schema,
        sourceText,
        position,
        parser: queryParser(),
      }),
    ).toMatchSnapshot();
  });

  it('directives: include relay directives', () => {
    const { sourceText, position } = code(`
      Relay.QL\`
        fragment on Test @relay {
                #----------^
        }
      \`;
    `);
    expect(
      getHintsAtPosition({
        schema: relayExtendSchema(schema),
        sourceText,
        position,
        parser: relayQLParser(),
      }),
    ).toMatchSnapshot();
  });

  it('args', () => {
    const { sourceText, position } = code(`
      Relay.QL\`
        fragment on Test @relay() {
            --------------------^
          id
        }
      \`;
    `);
    expect(
      getHintsAtPosition({
        schema: relayExtendSchema(schema),
        sourceText,
        position,
        parser: relayQLParser(),
      }),
    ).toMatchSnapshot();
  });

  it('args: value', () => {
    const { sourceText, position } = code(`
      Relay.QL\`
        fragment on Test @relay(pattern:  ) {
                                ---------^
          id
        }
      \`;
    `);
    expect(
      getHintsAtPosition({
        schema: relayExtendSchema(schema),
        sourceText,
        position,
        parser: relayQLParser(),
      }),
    ).toMatchSnapshot();
  });
});

describe('show meta field __typename in abstract types', () => {
  it('interface type', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment on Node {
          id
          __type
        #-------^
        }
      \`
    `);
    expect(
      getHintsAtPosition({
        schema,
        sourceText,
        position,
        parser: relayQLParser(),
      }),
    ).toMatchSnapshot();
  });

  it('union type', () => {
    const { sourceText, position } = code(`
      const a = Relay.QL\`
        fragment on Entity {
          __type
        #-------^
        }
      \`
    `);
    expect(
      getHintsAtPosition({
        schema,
        sourceText,
        position,
        parser: relayQLParser(),
      }),
    ).toMatchSnapshot();
  });
});

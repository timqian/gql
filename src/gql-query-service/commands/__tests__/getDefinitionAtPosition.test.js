/* @flow */
import getDefinitionAtPosition from '../getDefinitionAtPosition';
import { getDefLocations, getSchema } from 'gql-test-utils/test-data';
import code from 'gql-test-utils/code';
import {
  customParser,
  relayQLParser,
  queryParser,
} from 'gql-test-utils/parsers';

describe('getDef', () => {
  const defLocations = getDefLocations();
  let schema = null;
  beforeAll(async () => {
    schema = await getSchema();
  });

  describe('fragments', () => {
    it('on Type', () => {
      const { sourceText, position } = code(`
        const a = Relay.QL\`
          fragment test on Player {
                #------------^
            id
          }
        \`
      `);

      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: relayQLParser(),
        }),
      ).toEqual(defLocations.Player);
    });

    it('field', () => {
      const { sourceText, position } = code(`
        const a = Relay.QL\`
          fragment test on Player {
            id
          #--^
          }
        \`
      `);
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: relayQLParser(),
        }),
      ).toEqual(defLocations.Player_id);
    });

    it('field arguments', () => {
      const { sourceText, position } = code(`
        const a = Relay.QL\`
          fragment test on Player {
            image(size
              #-----^
          }
        \`
      `);
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: relayQLParser(),
        }),
      ).toEqual(defLocations.Player_image_arg_size);
    });

    it('should work in custom files', () => {
      const { sourceText, position } = code(`
        """
        fragment test on Player {
                  #--------^
          id
        }
        """
      `);

      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: customParser(),
        }),
      ).toEqual(defLocations.Player);
    });

    it('should work with multiple Relay.QL', () => {
      const { sourceText, position } = code(`
        const a = Relay.QL\`
          fragment test on Player {
            id
          }
        \`);

        const b = Relay.QL\`
          fragment test2 on Player {
            id
          #--^
          }
        \`);
      `);

      // const position = { line: 10, column: 14 };
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: relayQLParser(),
        }),
      ).toEqual(defLocations.Player_id);
    });

    it('should work in simple gql files', () => {
      const { sourceText, position } = code(`
        fragment test on Player {
                    #-------^
          id
        }
      `);
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: queryParser(),
        }),
      ).toEqual(defLocations.Player);
    });

    it('should work in custom files', () => {
      const { sourceText, position } = code(`
        """
        fragment test on Player {
                  #--------^
          id
        }
        """
      `);
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: customParser(),
        }),
      ).toEqual(defLocations.Player);
    });
  });

  describe('mutations', () => {
    it('mutation keyword', () => {
      const { sourceText, position } = code(`
        const a = Relay.QL\`
          mutation { PlayerCreate }
          #--^
        \`
      `);
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: relayQLParser(),
        }),
      ).toEqual(defLocations.Mutation);
    });

    it('field', () => {
      const { sourceText, position } = code(`
        const a = Relay.QL\`
          mutation { PlayerCreate }
                #----------^
        \`
      `);
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: relayQLParser(),
        }),
      ).toEqual(defLocations.Mutation_PlayerCreate);
    });

    it('input object fields', () => {
      const { sourceText, position } = code(`
        mutation {
          PlayerCreate(
            input: {
              id: "some_id",
          #----^
              name: "some_name",
            }
          ) {
            player { id }
          }
        }
      `);
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: queryParser(),
        }),
      ).toEqual(defLocations.Mutation_PlayerCreateInput_id);
    });
  });

  describe('query', () => {
    it('query keyword', () => {
      const { sourceText, position } = code(`
        const a = Relay.QL\`
          query Viewer { viewer }
        #--^
        \`
      `);
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: relayQLParser(),
        }),
      ).toEqual(defLocations.Query);
    });
    it('field', () => {
      const { sourceText, position } = code(`
        const a = Relay.QL\`
          query Viewer { viewer }
                #-----------^
        \`
      `);
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: relayQLParser(),
        }),
      ).toEqual(defLocations.Query_viewer);
    });
  });

  describe('directives', () => {
    it('core: name', () => {
      const { sourceText, position } = code(`
        const a = Relay.QL\`
          fragment test on Player {
            image @include(if: true)
              #--------^
          }
        \`
      `);
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: relayQLParser(),
        }),
      ).toEqual(null);
    });

    it('core: args', () => {
      const { sourceText, position } = code(`
        const a = Relay.QL\`
          fragment test on Player {
            image @include(if: true)
                   #--------^
          }
        \`
      `);
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: relayQLParser(),
        }),
      ).toEqual(null);
    });

    it('user defined: name', () => {
      const { sourceText, position } = code(`
        const a = Relay.QL\`
          fragment test on Player {
            image @customDirective(if: true)
              #-------^
          }
        \`
      `);
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: relayQLParser(),
        }),
      ).toEqual(defLocations.customDirective);
    });

    it('user defined: args', () => {
      const { sourceText, position } = code(`
        const a = Relay.QL\`
          fragment test on Player {
            image @customDirective(if: true)
                            #-------^
          }
        \`
      `);
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: relayQLParser(),
        }),
      ).toEqual(defLocations.customDirective_argIf);
    });

    it('unknown: name', () => {
      const { sourceText, position } = code(`
        const a = Relay.QL\`
          fragment test on Player {
            image @xyzeagder(if: true)
              #-------^
          }
        \`
      `);
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: relayQLParser(),
        }),
      ).toEqual(null);
    });

    it('unknown directive: args', () => {
      const { sourceText, position } = code(`
        const a = Relay.QL\`
          fragment test on Player {
            image @xyzeagder(if: true)
                      #-------^
          }
        \`
      `);
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: relayQLParser(),
        }),
      ).toEqual(null);
    });

    it('known directive: unknown args', () => {
      const { sourceText, position } = code(`
        const a = Relay.QL\`
          fragment test on Player {
            image @include(ifs: true)
                    #-------^
          }
        \`
      `);
      expect(
        getDefinitionAtPosition({
          schema,
          sourceText,
          position,
          parser: relayQLParser(),
        }),
      ).toEqual(null);
    });
  });
});

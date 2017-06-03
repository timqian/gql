/* @flow */
import resolveConfigFile from '../resolveConfigFile';
import { createTempFiles } from 'gql-test-utils/file';

describe('schema-config', () => {
  test('default case', () => {
    expect(
      resolveConfigFile(
        {
          schema: {
            files: 'file/schema/*.gql',
          },
        },
        '',
      ),
    ).toMatchSnapshot();
  });

  test('use custom validation config', () => {
    expect(
      resolveConfigFile(
        {
          schema: {
            files: 'file/schema/*.gql',
            validate: {
              rules: {
                NoUnusedTypeDefinition: 'error',
              },
            },
          },
        },
        '',
      ),
    ).toMatchSnapshot();
  });

  test('use custom parser', () => {
    const rootPath = createTempFiles({
      './custom-parser.js': `
        module.exports = function customParser() {};
      `,
    });

    const resolvedConfig = resolveConfigFile(
      {
        schema: {
          files: 'file/schema/*.gql',
          parser: ['./custom-parser', { customParserOption: 5 }],
        },
      },
      rootPath,
    );
    expect(resolvedConfig).toMatchSnapshot();
    expect(resolvedConfig.schema.parser[0].name).toEqual('customParser');
  });

  test('use custom preset', () => {
    const rootPath = createTempFiles({
      'custom-preset': `
        module.exports = function custonPreset() {
          return {
            parser: 'gql-schema-parser-custom',
            parserOptions: { 'some-option': true },
            validate: {
              rules: [
                function someCustomRule() {},
              ],
              config: {
                someCustomRule: 'warn',
              },
            }
          };
        };
      `,
      'node_modules/gql-schema-parser-custom/package.json': `
        {
          "name": "gql-schema-parser-custom",
          "version": "1.0",
          "main": "index.js"
        }
      `,
      'node_modules/gql-schema-parser-custom/index.js': `
        module.exports = function customParser() {};
      `,
    });

    const resolvedConfig = resolveConfigFile(
      {
        schema: {
          files: 'file/schema/*.gql',
          preset: './custom-preset',
        },
      },
      rootPath,
    );

    expect(resolvedConfig).toMatchSnapshot();
  });
});

describe('query-files', () => {
  test('default case', () => {
    expect(
      resolveConfigFile(
        {
          schema: {
            files: 'file/schema/*.gql',
          },
          query: {
            files: [
              {
                match: 'files/**.js',
              },
            ],
          },
        },
        '',
      ),
    ).toMatchSnapshot();
  });

  describe('preset', () => {
    ['relay', 'apollo'].forEach(preset => {
      test(`preset: ${preset}`, () => {
        expect(
          resolveConfigFile(
            {
              schema: {
                files: 'file/schema/*.gql',
              },
              query: {
                files: [
                  {
                    match: 'files/**.js',
                    preset,
                  },
                ],
              },
            },
            '',
          ),
        ).toMatchSnapshot();
      });
    });

    test('custom-preset', () => {
      const rootPath = createTempFiles({
        'custom-preset': `
          module.exports = function customPreset() {
            return {
              parser: 'gql-query-parser-custom',
              parserOptions: { 'some-option': true },
              validate: {
                rules: [
                  function someCustomRule() {},
                ],
                config: {
                  someCustomRule: 'warn',
                },
              }
            };
          };
        `,
        'node_modules/gql-query-custom/package.json': `
          {
            "name": "gql-query-parser-custom",
            "version": "1.0",
            "main": "index.js"
          }
        `,
        'node_modules/gql-query-parser-custom/index.js': `
          module.exports = function customParser() {};
        `,
      });

      const resolvedConfig = resolveConfigFile(
        {
          schema: {
            files: 'file/schema/*.gql',
          },
          query: {
            files: [
              {
                match: 'files/**.js',
                preset: './custom-preset',
              },
            ],
          },
        },
        rootPath,
      );

      expect(resolvedConfig).toMatchSnapshot();
    });
  });
});

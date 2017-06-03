/* @flow */
import { loadQueryPreset } from '../loadPreset';
import { createTempFiles } from 'gql-test-utils/file';

describe('load core-preset:', () => {
  [
    'gql-query-preset-default',
    'gql-query-preset-relay',
    'gql-query-preset-apollo',
  ].forEach(preset => {
    test(`using full package name =${preset}`, () => {
      expect(loadQueryPreset(preset, '')).toBeDefined();
    });
  });

  ['default', 'relay', 'apollo'].forEach(preset => {
    test(`using short package name =${preset}`, () => {
      expect(loadQueryPreset(preset, '')).toBeDefined();
    });
  });
});

describe('missing-preset-pkg', () => {
  [
    'gql-query-preset-custom',
    './custom-preset',
    '@scope/custom',
    'custom_node_module',
  ].forEach(preset => {
    test(`should throw when preset=${preset}`, () => {
      expect(() => loadQueryPreset(preset, '')).toThrowErrorMatchingSnapshot();
    });
  });
});

describe('custom-preset', () => {
  test('load preset if it is defined in local file', () => {
    const rootPath = createTempFiles({
      'custom-preset': `
        /* this is invalid preset file */
        module.exports = function customPreset() {
          return {
            parserOptions: { },
            validate: {
              rules: [
                function someCustomRule(context) { }
              ],
              config: {
                someCustomRule: 'error',
              },
            }
          };
        };
      `,
    });

    expect(loadQueryPreset('./custom-preset', rootPath)).toMatchSnapshot();
  });

  describe('load preset if it is node_module', () => {
    const rootPath = createTempFiles({
      'node_modules/gql-query-preset-custom/package.json': `
        {
          "name": "gql-query-preset-custom",
          "version": "1.0"
        }
      `,
      'node_modules/gql-query-preset-custom/index.js': `
        module.exports = function customPreset() {
          return {
            parserOptions: { },
            validate: {
              rules: [
                function someCustomRule(context) { }
              ],
              config: {
                someCustomRule: 'error',
              },
            }
          };
        };
      `,
    });

    test('using full package name', () => {
      expect(
        loadQueryPreset('gql-query-preset-custom', rootPath),
      ).toMatchSnapshot();
    });

    test('using short package name', () => {
      expect(loadQueryPreset('custom', rootPath)).toMatchSnapshot();
    });
  });
});

test('Validation: throw if preset doesnt export function', () => {
  const rootPath = createTempFiles({
    'custom-preset': `
        /* this is invalid preset file */
        module.exports = {
          parserOptions: { }
        };
      `,
  });

  expect(() =>
    loadQueryPreset('./custom-preset', rootPath),
  ).toThrowErrorMatchingSnapshot();
});

test('Validation: throw if preset config invalid', () => {
  const rootPath = createTempFiles({
    'custom-preset': `
        /* this is invalid preset file */
        module.exports = function () {
          return {
            parserOptions: { }
          };
        };
      `,
  });

  expect(() =>
    loadQueryPreset('./custom-preset', rootPath),
  ).toThrowErrorMatchingSnapshot();
});
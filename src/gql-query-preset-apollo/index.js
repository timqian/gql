/* @flow */
import defaultPreset from 'gql-query-preset-default';

export default function queryPresetApollo() {
  const defaultPresetConfig = defaultPreset();

  return {
    parser: [
      'gql-query-parser-embedded-queries',
      {
        start: 'gql`',
        end: '`',
      },
    ],

    parserOptions: {
      allowDocumentInterpolation: true,
    },

    validate: {
      rules: defaultPresetConfig.validate.rules,

      config: {
        ...defaultPresetConfig.validate.config,
        // [No-need not possible in apollo]
        KnownFragmentNames: 'off',
        // [no need: its very hard to detect correctly in apollo]
        NoUnusedFragments: 'off',
        // [No-need]
        LoneAnonymousOperation: 'off',
      },
    },
  };
}

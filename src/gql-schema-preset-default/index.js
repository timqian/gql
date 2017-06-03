/* @flow */
import { NoUnusedTypeDefinition } from './rules/NoUnusedTypeDefinition';

export default function schemaPresetDefault() {
  return {
    parser: 'gql-schema-parser-default',

    validate: {
      rules: {
        NoUnusedTypeDefinition,
      },
      config: {
        NoUnusedTypeDefinition: 'warn',
      },
    },
  };
}

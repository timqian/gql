/* @flow */
import { specifiedRules } from 'graphql/validation/specifiedRules';

// modified rules
import { ArgumentsOfCorrectType } from './rules/ArgumentsOfCorrectType';
import { RequiredOperationName } from './rules/RequiredOperationName';

export default function queryPresetDefault() {
  const coreRules = specifiedRules.reduce((acc, rule) => {
    acc[rule.name] = rule;
    return acc;
  }, {});

  return {
    parser: 'gql-query-parser-default',

    parserOptions: {},

    validate: {
      rules: {
        ...coreRules,
        ArgumentsOfCorrectType,
        RequiredOperationName,
      },

      config: coreRules.reduce(
        (acc, rule) => {
          acc[rule] = 'error';
          return acc;
        },
        {
          RequiredOperationName: 'warn',
        },
      ),
    },
  };
}

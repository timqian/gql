/* @flow */
import defaultPreset from '../gql-query-preset-default';
import extendSchema from './extendSchema';

import { ExactlyOneOperationPerTag } from './rules/ExactlyOneOperationPerTag';
import { NoSchemaDefinition } from './rules/NoSchemaDefinition';

type Options = {
  compact: boolean,
  classic: boolean,
};

export default function relayModernPreset(options: Options) {
  const defaultPresetConfig = defaultPreset();

  return {
    parser: [
      'gql-query-parser-embedded-queries',
      {
        start: 'graphql(?:\\.experimental)?`',
        end: '`',
      },
    ],

    parserOptions: {
      allowFragmentWithoutName: true,
      allowFragmentInterpolation: true,
    },

    extendSchema,

    validate: {
      rules: [
        ...defaultPresetConfig.validate.rules,
        ExactlyOneOperationPerTag,
        NoSchemaDefinition,
      ],

      config: {
        ...{
          KnownArgumentNamesRule: 'error',
          // TODO #19327202 Relay Classic generates some fragments in runtime, so Relay
          // Modern queries might reference fragments unknown in build time
          // KnownFragmentNamesRule,
          NoFragmentCyclesRule: 'error',
          // TODO #19327144 Because of graphql.experimental feature
          // @argumentDefinitions, this validation incorrectly marks some fragment
          // variables as undefined.
          // NoUndefinedVariablesRule,
          // TODO #19327202 Queries generated dynamically with Relay Classic might use
          // unused fragments
          // NoUnusedFragmentsRule,
          NoUnusedVariablesRule: 'error',
          // TODO #19327202 Relay Classic auto-resolves overlapping fields by
          // generating aliases
          //OverlappingFieldsCanBeMergedRule,
          ProvidedNonNullArgumentsRule: 'error',
          UniqueArgumentNamesRule: 'error',
          UniqueFragmentNamesRule: 'error',
          UniqueInputFieldNamesRule: 'error',
          UniqueOperationNamesRule: 'error',
          UniqueVariableNamesRule: 'error',

          ArgumentsOfCorrectTypeRule: 'error',
          DefaultValuesOfCorrectTypeRule: 'error',
          // TODO #13818691: make this aware of @fixme_fat_interface
          // FieldsOnCorrectTypeRule,
          FragmentsOnCompositeTypesRule: 'error',
          KnownTypeNamesRule: 'error',
          // TODO #17737009: Enable this after cleaning up existing issues
          // KnownDirectivesRule,
          LoneAnonymousOperationRule: 'error',
          PossibleFragmentSpreadsRule: 'error',
          ScalarLeafsRule: 'error',
          VariablesAreInputTypesRule: 'error',
          VariablesInAllowedPositionRule: 'error',
        },

        // Extra Rules
        ExactlyOneOperationPerTag: 'error',
        NoSchemaDefinition: 'error',
      },
    },
  };
}

/* @flow */
import { type QueryPreset, type SchemaPreset } from './types';

export function mergeQueryPresets(presets: Array<QueryPreset>): QueryPreset {
  const emptyPreset: QueryPreset = {
    parser: 'default',
    parserOptions: {},
    extendSchema: null,
    validate: {
      rules: {},
      config: {},
    },
  };

  return presets.reduce((config, preset) => {
    // merge parser
    if (preset.parser) {
      config.parser = preset.parser;
    }

    // merge parserOptions
    if (preset.parserOptions) {
      config.parserOptions = {
        ...config.parserOptions,
        ...preset.parserOptions,
      };
    }

    // merge extendSchema
    if (preset.extendSchema) {
      config.extendSchema = schema => {
        const extendedSchema = config.extendSchema
          ? config.extendSchema(schema)
          : schema;

        // $FlowDisableNextLine: we already check preset.extendSchema exists
        return preset.extendSchema(extendedSchema);
      };
    }

    // merge validateOptions
    if (preset.validate) {
      config.validate = mergeValidateConfig(config.validate, preset.validate);
    }

    return config;
  }, emptyPreset);
}

export function mergeSchemaPresets(presets: Array<SchemaPreset>): SchemaPreset {
  const emptyPreset: SchemaPreset = {
    parser: 'default',
    parserOptions: {},
    extendSchema: null,
    validate: {
      rules: {},
      config: {},
    },
  };

  return presets.reduce((config, preset) => {
    // merge parser
    if (preset.parser) {
      config.parser = preset.parser;
    }

    // merge extendSchema
    if (preset.extendSchema) {
      config.extendSchema = schema => {
        const extendedSchema = config.extendSchema
          ? config.extendSchema(schema)
          : schema;

        // $FlowDisableNextLine: we already check preset.extendSchema exists
        return preset.extendSchema(extendedSchema);
      };
    }

    // merge parserOptions
    if (preset.parserOptions) {
      config.parserOptions = {
        ...config.parserOptions,
        ...preset.parserOptions,
      };
    }

    // merge validateOptions
    if (preset.validate) {
      config.validate = mergeValidateConfig(config.validate, preset.validate);
    }

    return config;
  }, emptyPreset);
}

function mergeValidateConfig(
  pkgA: ValidationRulesPkg,
  pkgB: ValidationRulesPkg,
): ValidationRulesPkg {
  return {
    rules: {
      ...pkgA.rules,
      ...pkgB.rules,
    },
    config: {
      ...pkgA.config,
      ...pkgB.config,
    },
  };
}

/* @flow */
import {
  type GQLConfigFile,
  type GQLConfigFileResolved,
  type ValidateConfig,
  type ValidateConfigResolved,
} from './types';
import { loadQueryPresets, loadSchemaPresets } from './loadPresets';
import { loadSchemaParser, loadQueryParser } from './loadParser';
import { mergeQueryPresets, mergeSchemaPresets } from './mergePresets';

// will resolve all packages in config and normalize the config file
export default function resolveConfigFile(
  config: GQLConfigFile,
  configFilePath: string,
): GQLConfigFileResolved {
  const schemaPresets = loadSchemaPresets(
    config.schema.presets,
    configFilePath,
  );
  const schemaConfig = mergeSchemaPresets(schemaPresets);

  const [SchemaParserClass, schemaParserOptions] = loadSchemaParser(
    schemaConfig.parser,
    configFilePath,
  );

  const schemaConfigResolved = {
    files: config.schema.files,
    validate: resolveValidateConfig(schemaConfig.validate),
    parser: [
      SchemaParserClass,
      {
        // NOTE: preset should come first
        ...schemaConfig.parserOptions,
        ...schemaParserOptions,
      },
    ],
  };

  if (!config.query) {
    return {
      schema: schemaConfigResolved,
    };
  }

  return {
    schema: schemaConfigResolved,
    query: {
      files: config.query.files.map(({ match, parser, presets, validate }) => {
        // load presets packages
        const queryPresets = loadQueryPresets(presets, configFilePath);
        // merge presets to generate config
        const presetConfig = mergeQueryPresets([
          ...queryPresets,
          { parser, validate },
        ]);

        const [ParserClass, parserOptions] = loadQueryParser(
          // NOTE: settings in .gqlconfig overrides preset
          presetConfig.parser,
          configFilePath,
        );

        return {
          match,
          validate: resolveValidateConfig(presetConfig.validate),
          extendSchema: presetConfig.extendSchema,
          parser: [
            ParserClass,
            {
              ...presetConfig.parserOptions,
              ...parserOptions,
            },
          ],
        };
      }),
    },
  };
}

function resolveValidateConfig(
  validateConfig: ?ValidateConfig,
): ValidateConfigResolved {
  if (!validateConfig) {
    return {
      rules: [],
      config: {},
    };
  }

  const { rules, config } = validateConfig;
  return {
    rules: rules
      ? Object.keys(rules).reduce((acc, ruleName) => {
          const rule = rules[ruleName];
          if (config[ruleName] && config[ruleName] !== 'off') {
            acc.push(rule);
          }
          return acc;
        }, [])
      : [],
    config: validateConfig.config,
  };
}

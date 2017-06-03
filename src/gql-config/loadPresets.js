/* @flow */
/* @babel-flow-runtime-enable */
import path from 'path';
import importModule from 'gql-shared/importModule';
import { normalizePkgConfig } from './normalizePkg';
import { type QueryPreset, type SchemaPreset, type PresetPkg } from './types';

import { reify, Type } from 'flow-runtime';

const GQL_MODULE_DIR = path.resolve(__dirname, '../');

export function loadQueryPresets(
  presets: ?Array<PresetPkg>,
  configPath: string,
): Array<QueryPreset> {
  return (presets || ['default']).map(presetPkg => {
    return loadPreset({
      preset: presetPkg,
      configPath,
      prefix: 'gql-query-preset',
      corePresets: [
        'gql-query-preset-relay',
        'gql-query-preset-relay-modern',
        'gql-query-preset-apollo',
        'gql-query-preset-default',
      ],
      validate(presetModule) {
        const QueryPresetType = (reify: Type<QueryPreset>);
        QueryPresetType.assert(presetModule);
      },
    });
  });
}

export function loadSchemaPresets(
  presets: ?Array<PresetPkg>,
  configPath: string,
): Array<SchemaPreset> {
  return (presets || ['default']).map(presetPkg => {
    return loadPreset({
      preset: presetPkg,
      configPath,
      prefix: 'gql-schema-preset',
      corePresets: ['gql-schema-preset-default'],
      validate(presetModule) {
        const SchemaPresetType = (reify: Type<SchemaPreset>);
        SchemaPresetType.assert(presetModule);
      },
    });
  });
}

function loadPreset(params: {
  preset: PresetPkg,
  prefix: string,
  validate: Function,
  corePresets: Array<string>,
  configPath: string,
}) {
  const [presetPkg, options] = normalizePkgConfig(params.prefix, params.preset);

  const [pkg, dir] = params.corePresets.includes(presetPkg)
    ? [`./${presetPkg}`, GQL_MODULE_DIR]
    : [presetPkg, params.configPath];

  try {
    const presetModule = importModule(pkg, dir);

    if (typeof presetModule !== 'function') {
      throw new Error(
        `PRESET_PKG_INVALID: expected preset "${presetPkg}" to export "function" but found "${typeof presetModule}"`,
      );
    }

    const presetConfig = presetModule(options);

    // validate preset
    params.validate(presetConfig);

    return presetConfig;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        `PRESET_PKG_NOT_FOUND: Preset '${pkg}' not found relative to '${dir}'`,
      );
    }

    if (err.name === 'RuntimeTypeError') {
      throw new Error(
        `PRESET_CONFIG_INVALID: There are errors in preset '${pkg}'\n\n${err.message}`,
      );
    }

    throw err;
  }
}

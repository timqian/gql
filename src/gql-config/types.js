/* @flow */
/* @babel-flow-runtime-enable */
/* eslint-disable no-use-before-define */
import { type IParser, type ValidationRule } from 'gql-shared/types';
import { type GQLSchema } from 'gql-shared/GQLTypes';

export type Globs = string | Array<string>;
export type FileMatchConfig = Globs | { include: Globs, ignore?: Globs };

export type GQLConfigFile = {|
  schema: SchemaConfig,
  query?: {
    files: Array<QueryConfig>,
  },
|};

export type GQLConfigFileResolved = {|
  schema: SchemaConfigResolved,
  query?: {
    files: Array<QueryConfigResolved>,
  },
|};

export type SchemaConfig = {|
  files: FileMatchConfig,
  parser?: ParserPkg,
  validate?: ValidateConfig,
  presets?: Array<PresetPkg>,
|};

export type SchemaConfigResolved = {|
  files: FileMatchConfig,
  validate: ValidateConfigResolved,
  parser: ParserConfigResolved,
  extendSchema?: ?(schema: GQLSchema) => GQLSchema,
|};

export type QueryConfig = {|
  match: FileMatchConfig,
  parser?: ParserPkg,
  validate?: ValidateConfig,
  presets?: Array<PresetPkg>,
|};

export type QueryConfigResolved = {|
  match: FileMatchConfig,
  parser: ParserConfigResolved,
  validate: ValidateConfigResolved,
  extendSchema?: ?(schema: GQLSchema) => GQLSchema,
|};

export type ValidateConfig = {|
  rules?: { [name: string]: ValidationRule },
  config: ValidateRulesConfig,
|};

export type ValidateRulesConfig = {
  [ruleName: string]: 'off' | 'warn' | 'error',
};

export type ValidateConfigResolved = {|
  rules: Array<ValidationRule>,
  config: ValidateRulesConfig,
|};

type PkgOptions = Object;
type PkgName = string;
export type PkgConfig = PkgName | [PkgName, PkgOptions];

export type PresetPkg = PkgConfig;
export type ParserPkg = PkgConfig;
export type ParserOptions = Object;
export type ParserConfigResolved = [Class<IParser>, ParserOptions];

export type QueryPreset = {
  parser?: ?ParserPkg,
  parserOptions?: Object,
  extendSchema?: ?(schema: GQLSchema) => GQLSchema,
  validate?: ?ValidateConfig,
};

export type SchemaPreset = {
  parser?: ParserPkg,
  parserOptions?: Object,
  extendSchema?: ?(schema: GQLSchema) => GQLSchema,
  validate: ValidateConfig,
};

import { reify, type Type } from 'flow-runtime';

export function validateConfigFile(fileData) {
  const GQLConfigFileType = (reify: Type<GQLConfigFile>);
  return GQLConfigFileType.assert(fileData);
}

/* @flow */
import path from 'path';
import fs from 'fs';

import { Source } from 'graphql/language/source';
import parseQuery, { type ParsedQuery } from './shared/parseQuery';

import GQLWatcher from 'gql-watcher';
import validate from 'gql-shared/validate';
import { type GQLSchema } from 'gql-shared/GQLTypes';
import {
  type WatchFile,
  type GQLLocation,
  type GQLHint,
  type GQLInfo,
  type GQLPosition,
} from 'gql-shared/types';
import EventEmitter, { type EmitterSubscription } from 'gql-shared/emitter';
import { type GQLError } from 'gql-shared/GQLError';
import createParser from 'gql-shared/createParser';
import GQLBaseService from 'gql-shared/GQLBaseService';

import getDefinitionAtPosition from './commands/getDefinitionAtPosition';
import getHintsAtPosition from './commands/getHintsAtPosition';
import getInfoOfTokenAtPosition from './commands/getInfoOfTokenAtPosition';

import GQLConfig from 'gql-config';
import { type QueryConfigResolved } from 'gql-config/types';
import invariant from 'invariant';

type CommandParams = {
  fileContent: string,
  fileOptions: QueryConfigResolved,
  position: GQLPosition,
};

type Options = {
  config: GQLConfig,
  getSchema: () => GQLSchema,
  watcher: GQLWatcher,
};

type ParsedQueryFile = {| parsed: ParsedQuery, config: QueryConfigResolved |};

export class GQLQueryService extends GQLBaseService {
  _emitter = new EventEmitter();
  _initialized: boolean = false;
  _config: GQLConfig;
  _errors: Array<GQLError> = [];
  _parsedFilesMap: Map<string, ParsedQueryFile> = new Map();
  _getSchema: () => GQLSchema;
  _options: Options;

  _watchers: Array<Watcher> = [];

  constructor(options: Options) {
    super();
    this._options = options;
    this._config = options.config;
    this._getSchema = options.getSchema;
  }

  // commands
  getDefinitionAtPosition(params: CommandParams): ?GQLLocation {
    return this._catchThrownErrors(() => {
      return getDefinitionAtPosition({
        parser: createParser(params.fileOptions.parser),
        schema: this.getSchema(params.fileOptions),
        sourceText: params.fileContent,
        position: params.position,
      });
    }, null);
  }

  getInfoOfTokenAtPosition(params: CommandParams): ?GQLInfo {
    return this._catchThrownErrors(() => {
      return getInfoOfTokenAtPosition({
        parser: createParser(params.fileOptions.parser),
        schema: this.getSchema(params.fileOptions),
        sourceText: params.fileContent,
        position: params.position,
      });
    }, null);
  }

  getHintsAtPosition(params: CommandParams): Array<GQLHint> {
    return this._catchThrownErrors(() => {
      return getHintsAtPosition({
        parser: createParser(params.fileOptions.parser),
        schema: this.getSchema(params.fileOptions),
        sourceText: params.fileContent,
        position: params.position,
      });
    }, []);
  }

  getErrors(): Array<GQLError> {
    return this._errors;
  }

  getSchema(fileConfig: QueryConfigResolved): GQLSchema {
    // FIXME: extend schema is costly so cache result and compute only once per config
    // and only when schema changed
    const schema = this._getSchema();
    return fileConfig.extendSchema ? fileConfig.extendSchema(schema) : schema;
  }

  // private methods
  async _handleStart() {
    const queryConfig = this._config.getQueryConfig();
    if (!queryConfig) {
      return;
    }

    // setup watchers and wait for watch to start
    await Promise.all(
      queryConfig.files.map((fileConfig, index) => {
        const watcher = this._options.watcher.watch({
          rootPath: this._config.getDir(),
          files: fileConfig.match,
          name: `gqlQueryFiles-${index}`,
          onChange: (files: Array<WatchFile>) => {
            try {
              this._updateFiles(files, fileConfig);
            } catch (e) {
              this._emitter.emit('error', e);
            }
            this._emitter.emit('change');
          },
        });
        this._watchers.push(watcher);
        return watcher.onReady();
      }),
    );
  }

  async _handleStop() {
    this._watchers.forEach(watcher => {
      watcher.close();
    });
    this._watchers = [];
    this._isRunning = false;
    await Promise.resolve();
  }

  _updateFiles(files: Array<WatchFile>, config: QueryConfigResolved) {
    if (files.length === 0) {
      return;
    }

    // console.time('updating files');
    files.forEach(({ name, exists }) => {
      // console.log(name, exists);
      const absPath = path.join(this._config.getDir(), name);
      if (exists) {
        // console.time('parseFile');
        this._parsedFilesMap.set(absPath, this._parseFile(absPath, config));
        // console.timeEnd('parseFile');
      } else {
        this._parsedFilesMap.delete(absPath);
      }
    });
    // console.timeEnd('updating files');
    this._errors = this._findErrors();
  }

  _findErrors = () => {
    const errors = [];
    this._parsedFilesMap.forEach(parsedFile => {
      if (parsedFile.parsed.isEmpty) {
        return;
      }

      parsedFile.parsed.queries.forEach(query => {
        if (query.error) {
          errors.push(query.error);
        } else {
          const { ast } = query;
          invariant(ast, '[unexpected error] ast should exists here');
          const validationErrors = validate(
            this.getSchema(parsedFile.config),
            ast,
            parsedFile.config.validate,
          );
          if (validationErrors) {
            errors.push(...validationErrors);
          }
        }
      });
    });
    return errors;
  };

  _parseFile = (absPath: string, config: QueryConfigResolved) => {
    const content = fs.readFileSync(absPath, 'utf8');
    const source = new Source(content, absPath);
    const parsed = parseQuery(source, createParser(config.parser));
    return {
      parsed,
      config,
    };
  };
}

export default GQLQueryService;

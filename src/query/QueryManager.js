/* @flow */
import path from 'path';
import fs from 'fs';
import EventEmitter, { type EmitterSubscription } from '../shared/emitter';

import { Source } from 'graphql/language/source';

import { type GQLError, SEVERITY, toGQLError } from '../shared/GQLError';
import GQLWatcher from '../shared/GQLWatcher';

import validate from './validation/validate';
import parseQuery from './_shared/parseQuery';
import GQLConfig from '../config/GQLConfig';


import { type GQLSchema } from '../shared/GQLTypes';
import { type ParsedFilesMap, type WatchFile } from '../shared/types';

type Options = {
  config: GQLConfig,
  getSchema: () => GQLSchema,
  watcher: GQLWatcher,
};

export class QueryManager {
  _emitter = new EventEmitter();
  _initialized: boolean = false;
  _config: GQLConfig;
  _errors: Array<GQLError> = [];
  _parsedFilesMap: ParsedFilesMap = new Map();
  _getSchema: () => GQLSchema;
  _options: Options;

  constructor(options: Options) {
    this._options = options;
    this._config = options.config;
    this._getSchema = options.getSchema;
    this._setupWatcher();
  }

  _setupWatcher() {
    const queryConfig = this._config.getQuery();
    if (!queryConfig) {
      return;
    }
    let leftInitCount = queryConfig.files.length;
    queryConfig.files.forEach((fileConfig, index) => {
      this._options.watcher.watch({
        rootPath: this._config.getDir(),
        files: fileConfig.match,
        name: `gqlQueryFiles-${index}`,
        onChange: (files: Array<WatchFile>) => {
          try {
            this._updateFiles(files, fileConfig);
          } catch (e) {
            this._emitter.emit('error', e);
          }
          // console.log('init done');
          if (!this._initialized) {
            leftInitCount -= 1;
            if (leftInitCount === 0) {
              this._initialized = true;
              this._emitter.emit('init');
            }
          }

          if (this._initialized) {
            this._emitter.emit('change');
          }
        },
      });
    });
  }

  onInit(listener: () => void): EmitterSubscription {
    return this._emitter.addListener('init', listener);
  }

  onChange(listener: () => void): EmitterSubscription {
    return this._emitter.addListener('change', listener);
  }

  onError(listener: () => void): EmitterSubscription {
    return this._emitter.addListener('change', listener);
  }

  getErrors(): Array<GQLError> {
    return this._errors;
  }

  // private methods
  _updateFiles(files: Array<WatchFile>, config: any) {
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
    const schema = this._getSchema();
    const errors = [];
    this._parsedFilesMap.forEach((parsedFile) => {
      if (parsedFile.isEmpty) {
        return;
      }

      if (parsedFile.error) {
        errors.push(parsedFile.error);
      } else {
        const validationErrors = validate(schema, parsedFile.ast, parsedFile.config);
        if (validationErrors) {
          errors.push(...validationErrors);
        }
      }
    });
    return errors;
  };

  _parseFile = (absPath: string, config: any) => {
    const content = fs.readFileSync(absPath, 'utf8');
    const source = new Source(content, absPath);
    try {
      const { ast, isEmpty } = parseQuery(source, config);
      return {
        ast,
        error: null,
        isEmpty,
        config,
      };
    } catch (err) {
      return {
        error: toGQLError(err, SEVERITY.error),
        ast: null,
        config,
      };
    }
  };
}

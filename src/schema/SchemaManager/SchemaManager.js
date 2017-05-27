/* @flow */
import path from 'path';
import fs from 'fs';

import EventEmitter, { type EmitterSubscription } from '../../shared/emitter';
import GQLWatcher from '../../shared/GQLWatcher';

import { parse } from 'graphql/language/parser';
import { Source } from 'graphql/language/source';
import { GraphQLSchema } from 'graphql/type';

import { buildASTSchema } from './buildASTSchema';
import { buildASTSchema as buildASTGraphQLSchema } from 'graphql/utilities';

import { type GQLError, SEVERITY, toGQLError } from '../../shared/GQLError';

import { validate } from '../../schema';
import GQLConfig from '../../config/GQLConfig';

import { type ParsedFilesMap, type WatchFile } from '../../shared/types';

import { type GQLSchema } from '../../shared/GQLTypes';
import { type DocumentNode } from 'graphql/language/ast';

type Options = {|
  config: GQLConfig,
  watcher: GQLWatcher,
|};

export default class SchemaManager {
  _emitter = new EventEmitter();
  _schema: GQLSchema;
  _ast: DocumentNode;
  _errors: Array<GQLError>;
  _parsedFilesMap: ParsedFilesMap = new Map();
  _isInitialized: boolean = false;
  _options: Options;
  _watcher: *;

  constructor(options: Options) {
    this._options = options;
    this._setupWatcher();
  }

  _setupWatcher() {
    // watch schema files and rebuild schema
    // console.log(config.getDir());
    const options = this._options;

    this._watcher = this._options.watcher.watch({
      name: 'gqlSchemaFiles',
      rootPath: options.config.getDir(),
      files: options.config.getSchema().files,
      onChange: (files: Array<WatchFile>) => {
        // Handle Error
        try {
          this._updateFiles(files);
        } catch (e) {
          this._emitter.emit('error', e);
        }

        if (!this._isInitialized) {
          this._isInitialized = true;
          this._emitter.emit('init');
        }

        this._emitter.emit('change');
      },
    });
  }

  onInit(listener: () => void): EmitterSubscription {
    return this._emitter.addListener('init', listener);
  }

  onError(listener: () => void): EmitterSubscription {
    return this._emitter.addListener('error', listener);
  }

  onChange(listener: () => void): EmitterSubscription {
    return this._emitter.addListener('change', listener);
  }

  getSchema(): GQLSchema {
    return this._schema;
  }

  getGraphQLSchema(): GraphQLSchema {
    return buildASTGraphQLSchema(this._ast);
  }

  getSchemaErrors(): Array<GQLError> {
    return this._errors;
  }

  // private methods
  _updateFiles(files: Array<WatchFile>) {
    const options = this._options;
    const schemaOptions = options.config.getSchema();

    if (files.length === 0) {
      return;
    }

    // console.time('updating files');
    files.forEach(({ name, exists }) => {
      // console.log(name, exists);
      const absPath = path.join(options.config.getDir(), name);
      if (exists) {
        this._parsedFilesMap.set(absPath, this._parseFile(absPath));
      } else {
        this._parsedFilesMap.delete(absPath);
      }
    });
    // console.timeEnd('updating files');

    //  build merged ast
    // console.time('buildAST');
    const { ast, errors: parseErrors } = this._buildASTFromParsedFiles(this._parsedFilesMap);
    // console.timeEnd('buildAST');

    // build GQLSchema from ast
    // console.time('buildASTSchema');
    const { schema, errors: buildErrors } = buildASTSchema(ast);
    // console.timeEnd('buildASTSchema');

    // validate
    // console.time('validate');
    // console.log(config.validate);
    const validationErrors = validate(schema, ast, schemaOptions.validate);
    // console.timeEnd('validate');

    this._ast = ast;
    this._schema = schema;
    this._errors = [...parseErrors, ...buildErrors, ...validationErrors];
  }

  _parseFile = (absPath: string) => {
    const content = fs.readFileSync(absPath, 'utf8');
    const source = new Source(content, absPath);
    try {
      const ast = parse(source);
      return {
        ast,
        error: null,
        source,
      };
    } catch (err) {
      return {
        error: toGQLError(err, SEVERITY.error),
        ast: null,
        source,
      };
    }
  };

  _buildASTFromParsedFiles = (parsedFiles: ParsedFilesMap) => {
    const mergedDefinitions = [];
    const errors = [];
    for (const parsedFile of parsedFiles.values()) {
      // eslint-disable-line no-restricted-syntax
      const { ast, error } = parsedFile;
      if (error) {
        errors.push(error);
      } else {
        const { definitions } = ast;
        mergedDefinitions.push(...definitions);
      }
    }

    return {
      errors, // parsed errors
      ast: {
        kind: 'Document',
        definitions: mergedDefinitions,
      },
    };
  };
}

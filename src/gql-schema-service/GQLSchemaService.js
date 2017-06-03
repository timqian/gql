/* @flow */
import path from 'path';
import fs from 'fs';

import { parse } from 'graphql/language/parser';
import { Source } from 'graphql/language/source';
import { GraphQLSchema } from 'graphql/type';
import { buildASTSchema as buildASTGraphQLSchema } from 'graphql/utilities';
import { type DocumentNode } from 'graphql/language/ast';

import { type GQLError, SEVERITY, toGQLError } from 'gql-shared/GQLError';
import validate from 'gql-shared/validate';
import GQLWatcher from 'gql-watcher';
import GQLBaseService from 'gql-shared/GQLBaseService';
import {
  type ParsedFilesMap,
  type WatchFile,
  type GQLPosition,
  type GQLHint,
  type GQLInfo,
  type GQLLocation,
} from 'gql-shared/types';
import { type GQLSchema } from 'gql-shared/GQLTypes';
import createParser from 'gql-shared/createParser';

import { buildASTSchema } from './shared/buildASTSchema';

// commands
import findRefsOfTokenAtPosition from './commands/findRefsOfTokenAtPosition';
import getDefinitionAtPosition from './commands/getDefinitionAtPosition';
import getHintsAtPosition from './commands/getHintsAtPosition';
import getInfoOfTokenAtPosition from './commands/getInfoOfTokenAtPosition';

import GQLConfig from 'gql-config';
import { type SchemaConfigResolved } from 'gql-config/types';

type Options = {|
  config: GQLConfig,
  watcher: GQLWatcher,
|};

type CommandParams = {
  fileContent: string,
  fileOptions: SchemaConfigResolved,
  position: GQLPosition,
};

export default class GQLSchemaService extends GQLBaseService {
  _schema: GQLSchema;
  _ast: DocumentNode;
  _errors: Array<GQLError>;
  _parsedFilesMap: ParsedFilesMap = new Map();

  _options: Options;
  _watcher: *;

  constructor(options: Options) {
    super();
    this._options = options;
  }

  async _handleStart() {
    const options = this._options;

    this._watcher = this._options.watcher.watch({
      name: 'gqlSchemaFiles',
      rootPath: options.config.getDir(),
      files: options.config.getSchemaConfig().files,
      onChange: (files: Array<WatchFile>) => {
        // Handle Error
        try {
          this._updateFiles(files);
        } catch (e) {
          this._emitter.emit('error', e);
        }

        this._emitter.emit('change');
      },
    });

    await this._watcher.onReady();
  }

  async _handleStop() {
    if (this._watcher) {
      await Promise.resolve(this._watcher.close());
    }
  }

  // commands
  findRefsOfTokenAtPosition(params: CommandParams): Array<GQLLocation> {
    return this._catchThrownErrors(() => {
      return findRefsOfTokenAtPosition({
        parser: createParser(params.fileOptions.parser),
        schema: this.getSchema(),
        sourceText: params.fileContent,
        position: params.position,
      });
    }, []);
  }

  getDefinitionAtPosition(params: CommandParams): ?GQLLocation {
    return this._catchThrownErrors(() => {
      return getDefinitionAtPosition({
        parser: createParser(params.fileOptions.parser),
        schema: this.getSchema(),
        sourceText: params.fileContent,
        position: params.position,
      });
    }, null);
  }

  getInfoOfTokenAtPosition(params: CommandParams): ?GQLInfo {
    return this._catchThrownErrors(() => {
      return getInfoOfTokenAtPosition({
        parser: createParser(params.fileOptions.parser),
        schema: this.getSchema(),
        sourceText: params.fileContent,
        position: params.position,
      });
    }, null);
  }

  getHintsAtPosition(params: CommandParams): Array<GQLHint> {
    return this._catchThrownErrors(() => {
      return getHintsAtPosition({
        parser: createParser(params.fileOptions.parser),
        schema: this.getSchema(),
        sourceText: params.fileContent,
        position: params.position,
      });
    }, []);
  }

  // utils methods
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
    const schemaOptions = options.config.getSchemaConfig();

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
    const { ast, errors: parseErrors } = this._buildASTFromParsedFiles(
      this._parsedFilesMap,
    );
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

/* @flow */
import * as schema from './schema';
import * as query from './query';

import GQLConfig from './config/GQLConfig';
import GQLWatcher from './shared/GQLWatcher';
import debug from './shared/debug';

import type { GQLHint, GQLInfo, DefLocation, Position } from './shared/types';

import type { GQLError } from './shared/GQLError';

type Options = $Exact<{
  cwd?: string,
  onChange?: () => void,
  onInit?: () => void,
  debug?: boolean,
  watchman?: boolean,
  watch?: boolean,
}>;

type CommandParams = $Exact<{
  sourcePath: string,
  sourceText: string,
  position: Position,
}>;

export type { Options as GQLServiceOptions };

const _noop = () => {}; // eslint-disable-line no-empty-function

export class GQLService {
  _isInitialized: boolean = false;
  _schemaManager: schema.SchemaManager;
  _queryManager: ?query.QueryManager;

  _config: GQLConfig;

  constructor(options: ?Options) {
    const {
      onInit = _noop,
      onChange = _noop,
      watchman,
      watch,
      debug: enableDebug,
      ...configOptions
    } = options || {};
    if (enableDebug) {
      (debug: any).enable();
    }

    this._config = new GQLConfig(configOptions);
    const watcher = new GQLWatcher({ watchman, watch });

    this._schemaManager = new schema.SchemaManager({
      config: this._config,
      watcher,
    });

    this._schemaManager.onChange(onChange);
    this._schemaManager.onInit(() => {
      if (!this._config.getQuery()) {
        this._isInitialized = true;
        onInit();
        return;
      }

      const queryManager = new query.QueryManager({
        config: this._config,
        getSchema: () => this._schemaManager.getSchema(),
        watcher,
      });

      this._queryManager = queryManager;

      queryManager.onInit(() => {
        this._isInitialized = true;
        onInit();
      });
      queryManager.onChange(onChange);
    });
  }

  // list all file extensions defined in gqlconfig
  getFileExtensions(): Array<string> {
    return this._config.getFileExtensions();
  }

  getSchema() {
    return this._schemaManager.getSchema();
  }

  status(): Array<GQLError> {
    if (!this._isInitialized) {
      return [];
    }
    const schemaErrors = this._schemaManager.getSchemaErrors();
    const queryErrors = this._queryManager ? this._queryManager.getErrors() : [];
    return schemaErrors.concat(queryErrors.filter((err) => Boolean(err)));
  }

  autocomplete(params: CommandParams): Array<GQLHint> {
    debug.log('\n[autocomplete]');
    debug.time('time');
    const { sourceText, sourcePath, position } = params;
    if (!this._isInitialized) {
      return [];
    }

    // codemirror instance
    let results = [];
    debug.time('match');
    const match = this._config.match(sourcePath);
    debug.timeEnd('match');
    debug.log('FileType:', match && match.type);

    debug.time('autocomplete');
    if (match && match.type === 'schema') {
      results = schema.commands.getHintsAtPosition(
        this._schemaManager.getSchema(),
        sourceText,
        position,
      );
    }

    if (match && match.type === 'query') {
      results = query.commands.getHintsAtPosition(
        this._schemaManager.getSchema(),
        sourceText,
        position,
        match.opts,
      );
    }
    debug.timeEnd('autocomplete');
    debug.timeEnd('time');
    return results;
  }

  getDef(params: CommandParams): ?DefLocation {
    debug.log('\n[getDef]');
    debug.time('time');
    const { sourceText, sourcePath, position } = params;
    if (!this._isInitialized) {
      return undefined;
    }

    let defLocation = null;
    debug.time('match');
    const match = this._config.match(sourcePath);
    debug.timeEnd('match');
    debug.log('FileType:', match && match.type);

    debug.time('getDef');
    if (match && match.type === 'schema') {
      defLocation = schema.commands.getDefinitionAtPosition(
        this._schemaManager.getSchema(),
        sourceText,
        position,
      );
    }

    if (match && match.type === 'query') {
      defLocation = query.commands.getDefinitionAtPosition(
        this._schemaManager.getSchema(),
        sourceText,
        position,
        match.opts.parser,
      );
    }
    debug.timeEnd('getDef');
    debug.timeEnd('time');
    return defLocation;
  }

  findRefs(params: CommandParams): Array<DefLocation> {
    debug.log('\n[findRefs]');
    debug.time('time');
    const { sourceText, sourcePath, position } = params;
    if (!this._isInitialized) {
      return [];
    }

    let refLocations = [];
    debug.time('match');
    const match = this._config.match(sourcePath);
    debug.timeEnd('match');
    debug.log('FileType:', match && match.type);

    debug.time('findRefs');
    if (match && match.type === 'schema') {
      refLocations = schema.commands.findRefsOfTokenAtPosition(
        this._schemaManager.getSchema(),
        sourceText,
        position,
      );
    }
    debug.timeEnd('findRefs');

    debug.timeEnd('time');
    // @TODO query not implemented
    return refLocations;
  }

  getInfo(params: CommandParams): ?GQLInfo {
    debug.log('\n[getInfo]');
    debug.time('time');
    const { sourcePath, sourceText, position } = params;
    if (!this._isInitialized) {
      return undefined;
    }

    let info = null;
    debug.time('match');
    const match = this._config.match(sourcePath);
    debug.timeEnd('match');
    debug.log('FileType:', match && match.type);

    debug.time('getInfoAtToken');
    if (match && match.type === 'schema') {
      info = schema.commands.getInfoOfTokenAtPosition(
        this._schemaManager.getSchema(),
        sourceText,
        position,
      );
    }

    if (match && match.type === 'query') {
      info = query.commands.getInfoOfTokenAtPosition(
        this._schemaManager.getSchema(),
        sourceText,
        position,
        match.opts,
      );
    }
    debug.timeEnd('getInfoAtToken');

    debug.timeEnd('time');
    return info;
  }
}

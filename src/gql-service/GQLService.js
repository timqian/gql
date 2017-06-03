/* @flow */
import GQLSchemaService from 'gql-schema-service';
import GQLQueryService from 'gql-query-service';
import GQLConfig from 'gql-config';
import GQLWatcher from 'gql-watcher';
import GQLBaseService from 'gql-shared/GQLBaseService';

import debug from 'gql-shared/debug';

import {
  type GQLHint,
  type GQLInfo,
  type GQLLocation,
  type GQLPosition,
} from 'gql-shared/types';

import { type GQLError } from 'gql-shared/GQLError';

type Options = $Exact<{
  cwd?: string,

  // watch
  watchman?: boolean,
  watch?: boolean,

  // debug
  debug?: boolean,
}>;

type CommandParams = $Exact<{
  sourcePath: string,
  sourceText: string,
  position: GQLPosition,
}>;

export type { Options as GQLServiceOptions };

export default class GQLService extends GQLBaseService {
  _schemaService: GQLSchemaService;
  _queryService: ?GQLQueryService;

  _config: GQLConfig;
  _watcher: GQLWatcher;

  constructor(_options: ?Options) {
    super();
    const options = _options || {};

    // enable debug mode
    if (options.debug) {
      debug.enable();
    }

    this._config = new GQLConfig({ cwd: options.cwd || process.cwd() });
    this._watcher = new GQLWatcher({
      watchman: options.watchman,
      watch: options.watch,
    });

    // setup schema service
    this._schemaService = new GQLSchemaService({
      config: this._config,
      watcher: this._watcher,
    });
    this._schemaService.onChange(this._triggerChange);
    this._schemaService.onError(this._triggerError);

    // setup query service
    if (this._config.getQueryConfig()) {
      const queryService = new GQLQueryService({
        config: this._config,
        getSchema: () => this._schemaService.getSchema(),
        watcher: this._watcher,
      });
      queryService.onChange(this._triggerChange);
      queryService.onError(this._triggerError);
      this._queryService = queryService;
    }
  }

  async _handleStart() {
    // start schema service
    await this._schemaService.start();
    if (this._queryService) {
      await this._queryService.start();
    }
  }

  async _handleStop() {
    await this._schemaService.stop();
    if (this._queryService) {
      await this._queryService.stop();
    }
  }

  getSchema(): GQLSchema {
    return this._schemaService.getSchema();
  }

  getConfig(): GQLConfig {
    return this._config;
  }

  status(): Array<GQLError> {
    if (!this._isRunning) {
      return [];
    }
    try {
      const schemaErrors = this._schemaService.getSchemaErrors();
      const queryErrors = this._queryService
        ? this._queryService.getErrors()
        : [];
      return schemaErrors.concat(queryErrors.filter(err => Boolean(err)));
    } catch (err) {
      this._triggerError(err);
      return [];
    }
  }

  autocomplete(params: CommandParams): Array<GQLHint> {
    return this._catchThrownErrors(() => {
      debug.log('\n[autocomplete]');
      debug.time('time');
      if (!this._isRunning) {
        return [];
      }

      // codemirror instance
      let results = [];
      debug.time('fileConfig');
      const fileConfig = this._config.getFileConfig(params.sourcePath);
      debug.timeEnd('fileConfig');
      debug.log('FileType:', fileConfig && fileConfig.type);

      debug.time('autocomplete');
      if (fileConfig && fileConfig.type === 'schema') {
        results = this._schemaService.getHintsAtPosition({
          fileContent: params.sourceText,
          fileOptions: fileConfig.opts,
          position: params.position,
        });
      }
      if (this._queryService && fileConfig && fileConfig.type === 'query') {
        results = this._queryService.getHintsAtPosition({
          fileContent: params.sourceText,
          fileOptions: fileConfig.opts,
          position: params.position,
        });
      }
      debug.timeEnd('autocomplete');
      debug.timeEnd('time');
      return results;
    }, []);
  }

  getDef(params: CommandParams): ?GQLLocation {
    return this._catchThrownErrors(() => {
      debug.log('\n[getDef]');
      debug.time('time');
      if (!this._isRunning) {
        return null;
      }

      let defLocation = null;
      debug.time('fileConfig');
      const fileConfig = this._config.getFileConfig(params.sourcePath);
      debug.timeEnd('fileConfig');
      debug.log('FileType:', fileConfig && fileConfig.type);

      debug.time('getDef');
      if (fileConfig && fileConfig.type === 'schema') {
        defLocation = this._schemaService.getDefinitionAtPosition({
          fileContent: params.sourceText,
          fileOptions: fileConfig.opts,
          position: params.position,
        });
      }

      if (this._queryService && fileConfig && fileConfig.type === 'query') {
        defLocation = this._queryService.getDefinitionAtPosition({
          fileContent: params.sourceText,
          fileOptions: fileConfig.opts,
          position: params.position,
        });
      }
      debug.timeEnd('getDef');
      debug.timeEnd('time');
      return defLocation;
    }, null);
  }

  findRefs(params: CommandParams): Array<GQLLocation> {
    return this._catchThrownErrors(() => {
      debug.log('\n[findRefs]');
      debug.time('time');
      if (!this._isRunning) {
        return [];
      }

      let refLocations = [];
      debug.time('fileConfig');
      const fileConfig = this._config.getFileConfig(params.sourcePath);
      debug.timeEnd('fileConfig');
      debug.log('FileType:', fileConfig && fileConfig.type);

      debug.time('findRefs');
      if (fileConfig && fileConfig.type === 'schema') {
        refLocations = this._schemaService.findRefsOfTokenAtPosition({
          fileContent: params.sourceText,
          fileOptions: fileConfig.opts,
          position: params.position,
        });
      }
      debug.timeEnd('findRefs');

      debug.timeEnd('time');
      // @TODO query not implemented
      return refLocations;
    }, []);
  }

  getInfo(params: CommandParams): ?GQLInfo {
    return this._catchThrownErrors(() => {
      debug.log('\n[getInfo]');
      debug.time('time');
      if (!this._isRunning) {
        return null;
      }

      let info = null;
      debug.time('fileConfig');
      const fileConfig = this._config.getFileConfig(params.sourcePath);
      debug.timeEnd('fileConfig');
      debug.log('FileType:', fileConfig && fileConfig.type);

      debug.time('getInfoAtToken');
      if (fileConfig && fileConfig.type === 'schema') {
        info = this._schemaService.getInfoOfTokenAtPosition({
          fileContent: params.sourceText,
          fileOptions: fileConfig.opts,
          position: params.position,
        });
      }

      if (this._queryService && fileConfig && fileConfig.type === 'query') {
        info = this._queryService.getInfoOfTokenAtPosition({
          fileContent: params.sourceText,
          fileOptions: fileConfig.opts,
          position: params.position,
        });
      }
      debug.timeEnd('getInfoAtToken');

      debug.timeEnd('time');
      return info;
    }, null);
  }
}

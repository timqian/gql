/* @flow */
import watch, { type WatchOptions } from './watch';
import { execSync } from 'child_process';
import { dedent } from 'dentist';

type Options = {
  watchman?: boolean,
  watch?: boolean,
};

export default class GQLWatcher {
  _watchers: Array<*> = [];
  _options: *;

  constructor(options: Options) {
    this._options = {
      ...options,
      watchman: typeof options.watchman === 'boolean' ? options.watchman : true,
      watch: typeof options.watch === 'boolean' ? options.watch : true,
    };

    if (this._options.watchman && this._options.watch) {
      // Disable watchman if not installed
      this._options.watchman = this._checkWatchmanInstalled();
    }
  }

  watch(options: WatchOptions) {
    const watcher = watch({
      ...options,
      watchman: this._options.watchman,
      watch: this._options.watch,
    });
    this._watchers.push(watcher);
    return watcher;
  }

  close() {
    this._watchers.forEach(watcher => {
      watcher.close();
    });
  }

  _checkWatchmanInstalled = () => {
    try {
      execSync('watchman --version', { stdio: ['ignore'] });
      return true;
    } catch (e) {
      return false;
      // const error = 'watchman is not found in PATH';
      // error.stack = ''; // dont want stack track to show up
      // throw error;
    }
  };
}

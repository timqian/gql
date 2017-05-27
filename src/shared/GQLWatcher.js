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
      this._verifyWatchmanInstalled();
    }
  }

  watch(options: WatchOptions) {
    const watcher = watch({
      ...options,
      watchman: this._options.watchman,
      watch: this._options.watch,
    });
    this._watchers.push(watcher);
  }

  close() {
    this._watchers.forEach((watcher) => {
      watcher.close();
    });
  }

  _verifyWatchmanInstalled = () => {
    try {
      execSync('watchman --version', { stdio: ['ignore'] });
    } catch (e) {
      const error = new Error(
        dedent(`
          Watchman was not found in PATH. See
          'https://facebook.github.io/watchman/docs/install.html
          for installation instructions.

          If you dont want to use watchman set
          "watchman: false" in options
        `),
      );
      error.stack = ''; // dont want stack track to show up
      throw error;
    }
  };
}

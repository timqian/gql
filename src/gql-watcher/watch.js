/* @flow */
import os from 'os';
import { type FileMatchConfig } from 'gql-config/types';
import sane from 'sane';
import globby from 'globby';
import _debounce from 'lodash/debounce';
import parseFileMatchConfig from 'gql-shared/parseFileMatchConfig';

export type WatchFile = $Exact<{
  name: string,
  exists: boolean,
}>;

class WatchEventsBatcher {
  _listener: (files: Array<WatchFile>) => void;
  _queue = [];
  _activeTimeout = null;
  _waitTimeForBatching = 200 /* msec */;

  constructor(listener: (files: Array<WatchFile>) => void) {
    this._listener = listener;
  }

  __dispatchQueue = _debounce(() => {
    const events = this._queue;
    this._queue = [];

    if (events.length === 0) {
      return;
    }

    this._listener(events);
  }, this._waitTimeForBatching);

  add(eventOrEvents: WatchFile | Array<WatchFile>) {
    this._queue.push(
      ...(Array.isArray(eventOrEvents) ? eventOrEvents : [eventOrEvents]),
    );
    this.__dispatchQueue();
  }
}

export type WatchOptions = {
  rootPath: string,
  files: FileMatchConfig,
  name: string,
  watchman?: boolean,
  watch?: boolean,
  onChange: (changedFiles: Array<WatchFile>) => void,
};

function boolValue(value: ?boolean, defaultValue: boolean) {
  return typeof value === 'boolean' ? value : defaultValue;
}

function setupWatcher({ rootPath, onChange, name, glob, ignored, watchman }) {
  const watchEventsBatcher = new WatchEventsBatcher(onChange);
  const useWatchman = boolValue(watchman, true);

  /* eslint-disable no-nested-ternary */
  const WatcherClass = useWatchman
    ? sane.WatchmanWatcher
    : os.platform() === 'darwin' ? sane.FSEventWatcher : sane.NodeWatcher;
  /* eslint-disable ternary */

  const watcher = new WatcherClass(rootPath, {
    glob,
    ignored,
  });

  // console.log(`[${WatcherClass.name}] '${name}' starting...`);
  const key = `[${WatcherClass.name}] '${name}' started`;
  // console.time(key);
  watcher.on('ready', () => {
    // console.timeEnd(key);
  });

  watcher.on('change', filePath => {
    watchEventsBatcher.add({ name: filePath, exists: true });
  });

  watcher.on('add', filePath => {
    watchEventsBatcher.add({ name: filePath, exists: true });
  });

  watcher.on('delete', filePath => {
    watchEventsBatcher.add({ name: filePath, exists: false });
  });

  return watcher;
}

export default function watch(options: WatchOptions) {
  const { glob, ignored } = parseFileMatchConfig(options.files);

  let watcher = null;
  const onReadyPromise = globby(glob, { cwd: options.rootPath })
    .then(matches => {
      const watchFiles = matches.map(file => ({ name: file, exists: true }));
      if (!boolValue(options.watch, true)) {
        return watchFiles;
      }
      // if in watchmode then wait for watcher to start
      return new Promise(resolve => {
        watcher = setupWatcher({
          rootPath: options.rootPath,
          onChange: options.onChange,
          watchman: options.watchman,
          name: options.name,
          glob,
          ignored,
        });
        watcher.on('ready', resolve);
      }).then(() => watchFiles);
    })
    .then(watchFiles => {
      options.onChange(watchFiles);
    })
    .catch(err => {
      throw err;
    });

  return {
    onReady() {
      return onReadyPromise;
    },
    close() {
      if (watcher) {
        watcher.close();
      }
    },
  };
}

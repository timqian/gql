/* @flow */
import { createTempFiles } from '../../../shared/test-utils';
import GQLConfig from '../../../config/GQLConfig';
import GQLWatcher from '../../../shared/GQLWatcher';
import SchemaManager from '../SchemaManager';

test('SchemaManager Crash: Interface', () => {
  const dir = createTempFiles({
    '.gqlconfig': `
      {
        schema: {
          files: "schema/**/*.gql",
        }
      }
    `,
    'schema/schema.gql': `
      interface Friendly {
        bestFriend: Friendly
      }

      type Person implements Friendly {
        bestFriend: Person
      }
    `,
  });

  const schemaPromise = new Promise((resolve, reject) => {
    const schemaManager = new SchemaManager({
      config: new GQLConfig({ cwd: dir }),
      watcher: new GQLWatcher({ watch: false }),
    });
    schemaManager.onInit(() => resolve('ok'));
    schemaManager.onError(reject);
  });
  expect(schemaPromise).resolves.toBeDefined();
});

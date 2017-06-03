/* @flow */
import { createTempFiles } from 'gql-test-utils/file';
import GQLConfig from 'gql-config';
import GQLWatcher from 'gql-watcher';

import GQLSchemaService from '../GQLSchemaService';

test('Issues: Crash: Interface', async () => {
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

  const schemaService = new GQLSchemaService({
    config: new GQLConfig({ cwd: dir }),
    watcher: new GQLWatcher({ watch: false }),
  });

  await schemaService.start();
});

/* @flow */
import { createTempFiles } from 'gql-test-utils/file';
/* @flow */
import GQLService from 'gql-service';
import path from 'path';
import { dedent } from 'dentist';

async function parseSource(source: string): Promise<any> {
  const rootPath = createTempFiles({
    '.gqlconfig': `
      {
        schema: {
          files: 'schema/*.gql',
          validate: {
            rules: {
              NoUnusedTypeDefinition: 'off'
            }
          }
        },

        query: {
          files: [
            {
              match: 'query/*.js',
              presets: 'relay-modern'
            }
          ]
        }
      }
    `,
    'schema/schema.gql': `
      type Query {
        viewer: Viewer!
      }

      type Viewer {
        me: User!
      }

      type User {
        id: ID!
        name: String
        image(size: Int!): String
      }
    `,

    'query/test.js': dedent(source),
  });

  const gql = new GQLService({
    cwd: rootPath,
    watch: false,
  });

  gql.onError(err => {
    throw err;
  });

  await gql.start();

  if (!gql._queryService) {
    throw new Error('Expecting query service to be present here');
  }

  return gql._queryService._parsedFilesMap.get(
    path.join(rootPath, 'query/test.js'),
  );
}

test('parse queries inside graphql tag', async () => {
  const { parsed } = await parseSource(`
    graphql\`
      fragment on Viewer {
        me { name }
      }
    \`
  `);

  expect(parsed.isEmpty).toBe(false);
});

test('parse queries inside graphql.experimental tag', async () => {
  const { parsed } = await parseSource(`
    graphql.experimental\`
      fragment on Viewer {
        me { name }
      }
    \`
  `);

  expect(parsed.isEmpty).toBe(false);
});

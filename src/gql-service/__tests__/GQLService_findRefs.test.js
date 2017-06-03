/* @flow */
import code from 'gql-test-utils/code';
import path from 'path';
import { createTempFiles } from 'gql-test-utils/file';
import GQLService from '../GQLService';

test('findRefs should return all references of token at given position', async () => {
  const dir = createTempFiles({
    '.gqlconfig': `
      {
        schema: {
          files: 'schema/*.gql',
        }
      }
    `,
    'schema/schema.gql': `
      type Query {
        viewer: Viewer
      }

      type Viewer {
        name: string
      }
    `,
  });
  const gql = new GQLService({
    cwd: dir,
    watch: false,
  });
  gql.onError(() => {
    throw err;
  });

  await gql.start();

  expect(
    gql.findRefs({
      sourcePath: path.join(dir, 'schema/user.gql'),
      ...code(`
        type User {
          viewer: Viewer
          #---------^
        }
      `),
    }),
  ).toMatchSnapshot();
});

test('should not throw if called before starting server', () => {
  const dir = createTempFiles({
    '.gqlconfig': `
      {
        schema: {
          files: 'schema/*.gql',
        }
      }
    `,
    'schema/schema.gql': `
      type Query {
        viewer: Viewer
      }

      type Viewer {
        name: string
      }
    `,
  });

  const gql = new GQLService({
    cwd: dir,
    watch: false,
    onError(err) {
      throw err;
    },
  });
  gql.onError(err => {
    throw err;
  });

  const run = () =>
    gql.findRefs({
      sourcePath: path.join(dir, 'schema/user.gql'),
      ...code(`
        type User {
          viewer: Viewer
          #---------^
        }
      `),
    });

  expect(run).not.toThrow();
  expect(run()).toEqual([]);
});

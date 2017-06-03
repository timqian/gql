/* @flow */
import code from 'gql-test-utils/code';
import path from 'path';
import { createTempFiles } from 'gql-test-utils/file';
import GQLService from '../GQLService';

describe('Schema: getDef', () => {
  it('works in schema files', async () => {
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

    gql.onError(err => {
      throw err;
    });

    await gql.start();

    expect(
      gql.getDef({
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

  it('works in schema files', () => {
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

    gql.onError(err => {
      throw err;
    });

    const run = () =>
      gql.getDef({
        sourcePath: path.join(dir, 'schema/user.gql'),
        ...code(`
          type User {
            viewer: Viewer
            #---------^
          }
        `),
      });

    expect(run).not.toThrow();
    expect(run()).toBe(null);
  });
});

describe('Query: getDef', () => {
  it('works in query files', async () => {
    const dir = createTempFiles({
      '.gqlconfig': `
        {
          schema: {
            files: 'schema/*.gql',
          },
          query: {
            files: [
              {
                match: 'query/*.gql',
              },
            ]
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

    gql.onError(err => {
      throw err;
    });
    await gql.start();

    expect(
      gql.getDef({
        sourcePath: path.join(dir, 'query/user.gql'),
        ...code(`
          fragment test on Viewer {
              #-------------^
            name
          }
        `),
      }),
    ).toMatchSnapshot();
  });
});

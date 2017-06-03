/* @flow */
import code from 'gql-test-utils/code';
import GQLService from '../GQLService';
import { createTempFiles } from 'gql-test-utils/file';
import path from 'path';

describe('Schema: autocomplete', () => {
  it('works in schema files', async () => {
    const rootPath = createTempFiles({
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
            name: String
          }
        `,
    });

    const gql = new GQLService({
      cwd: rootPath,
      watch: false,
    });
    gql.onError(err => {
      throw err;
    });

    await gql.start();

    expect(
      gql.autocomplete({
        sourcePath: path.join(rootPath, 'schema/user.gql'),
        ...code(`
            type User {
              viewer: Vi
              #---------^
            }
        `),
      }),
    ).toMatchSnapshot();
  });

  it('should not throw if called before server started', () => {
    const gql = new GQLService({
      cwd: createTempFiles({
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
            name: String
          }
        `,
      }),
      watch: false,
    });

    const run = () =>
      gql.autocomplete({
        sourcePath: 'schema/user.gql',
        ...code(`
        type User {
          viewer: Vi
          #---------^
        }
      `),
      });

    expect(run).not.toThrow();
    expect(run()).toEqual([]);
  });
});

describe('Query: autocomplete', () => {
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
                parser: 'default',
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
          name: String
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
      gql.autocomplete({
        sourcePath: path.join(dir, 'query/user.gql'),
        ...code(`
          fragment test on Viewer {
            na
            #--^
          }
        `),
      }),
    ).toMatchSnapshot();
  });
});

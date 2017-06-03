/* @flow */
/* eslint-disable max-len */
import GQLService from '../GQLService';
import { createTempFiles } from 'gql-test-utils/file';

describe('Schema', () => {
  it('should report errors in schema', async () => {
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
            viewer: xViewer # missing viewer
          }
        `,
      }),
      watch: false,
    });
    gql.onError(err => {
      throw err;
    });
    await gql.start();
    expect(gql.status()).toMatchSnapshot();
  });

  it('can modify validation rule severity', async () => {
    const gql = new GQLService({
      cwd: createTempFiles({
        'schema/schema.gql': `
          type Query {
            name: String
          }
          type Hello {
            name: String
          }
        `,
        '.gqlconfig': `{
          schema: {
            files: 'schema/*.gql',
            validate: {
              rules: {
                NoUnusedTypeDefinition: 'error',
              },
            }
          }
        }`,
      }),
      watch: false,
    });
    gql.onError(err => {
      throw err;
    });
    await gql.start();
    expect(gql.status()).toMatchSnapshot();
  });

  it('calling status before onInit should not throw', async () => {
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
            viewer: xViewer # missing viewer
          }
        `,
      }),
      watch: false,
    });
    gql.onError(err => {
      throw err;
    });

    expect(() => gql.status()).not.toThrow();
    expect(gql.status()).toEqual([]);
  });

  it('can turn off validation rules', async () => {
    const gql = new GQLService({
      cwd: createTempFiles({
        'schema/schema.gql': `
            type Query {
              name: String
            }
            type Hello {
              name: String
            }
          `,
        '.gqlconfig': `{
            schema: {
              files: 'schema/*.gql',
              validate: {
                rules: {
                  NoUnusedTypeDefinition: 'off',
                },
              }
            }
          }`,
      }),
      watch: false,
    });
    gql.onError(err => {
      throw err;
    });
    await gql.start();
    expect(gql.status()).toMatchSnapshot();
  });
});

describe('Query', () => {
  it('report query errors', async () => {
    const gql = new GQLService({
      cwd: createTempFiles({
        '.gqlconfig': `
          {
            schema: {
              files: 'schema/*.gql',
            },
            query: {
              files: [
                {
                  match: 'query/*.gql',
                }
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
        'query/query.gql': `
          query Test {
            xViewer {
              name
            }
          }
        `,
      }),
      watch: false,
    });
    gql.onError(err => {
      throw err;
    });
    await gql.start();
    expect(gql.status()).toMatchSnapshot();
  });
});

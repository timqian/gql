/* @flow */
/* eslint-disable max-len */
import { GQLService } from '../GQLService';
import { createTempFiles } from '../shared/test-utils';

describe('Schema', () => {
  it('should report errors in schema', (done) => {
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
      onInit() {
        expect(gql.status()).toMatchSnapshot();
        done();
      },
    });
  });

  it('can modify validation rule severity', (done) => {
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
              extends: 'gql-rules-schema',
              rules: {
                NoUnusedTypeDefinition: 'error',
              },
            }
          }
        }`,
      }),
      watch: false,
      onInit: () => {
        expect(gql.status()).toMatchSnapshot();
        done();
      },
    });
  });

  it('calling status before onInit should not throw', (done) => {
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
      onInit: done,
    });
    expect(() => gql.status()).not.toThrow();
    expect(gql.status()).toEqual([]);
  });

  it('can turn off validation rules', (done) => {
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
                extends: 'gql-rules-schema',
                rules: {
                  NoUnusedTypeDefinition: 'off',
                },
              }
            }
          }`,
      }),
      watch: false,
      onInit: () => {
        expect(gql.status()).toMatchSnapshot();
        done();
      },
    });
  });
});

describe('Query', () => {
  it('report query errors', (done) => {
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
                  parser: 'QueryParser',
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
          query {
            xViewer {
              name
            }
          }
        `,
      }),
      watch: false,
      onInit: () => {
        expect(gql.status()).toMatchSnapshot();
        done();
      },
    });
  });
});

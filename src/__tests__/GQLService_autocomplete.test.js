/* @flow */
import { code } from '../__test-data__/utils';
import { GQLService } from '../GQLService';
import { createTempFiles } from '../shared/test-utils';
import path from 'path';

describe('Schema: autocomplete', () => {
  it('works in schema files', (done) => {
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
            name: string
          }
        `,
    });
    const gql = new GQLService({
      cwd: rootPath,
      watch: false,
      onInit() {
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
        done();
      },
    });
  });

  it('should not throw if called before initialization', () => {
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
            name: string
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
  it('works in query files', (done) => {
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
                parser: 'QueryParser',
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
      onInit() {
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
        done();
      },
    });
  });
});

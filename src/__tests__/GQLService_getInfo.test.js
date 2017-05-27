/* @flow */
import { code } from '../__test-data__/utils';
import path from 'path';
import { createTempFiles } from '../shared/test-utils';
import { GQLService } from '../GQLService';

describe('Schema: getDef', () => {
  it('works in schema files', (done) => {
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
      onInit() {
        expect(
          gql.getInfo({
            sourcePath: path.join(dir, 'schema/user.gql'),
            ...code(`
                type User {
                  viewer: Viewer
                  #---------^
                }
              `),
          }),
        ).toMatchSnapshot();
        done();
      },
    });
  });
  it('should not throw if called before onInit', () => {
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
    const run = () =>
      gql.getInfo({
        sourcePath: path.join(dir, 'schema/user.gql'),
        ...code(`
          type User {
            viewer: Viewer
            #---------^
          }
        `),
      });

    expect(run).not.toThrow();
    expect(run()).toBeUndefined();
  });
});

describe('Query: getDef', () => {
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
          gql.getInfo({
            sourcePath: path.join(dir, 'query/user.gql'),
            ...code(`
                fragment test on Viewer {
                    #-------------^
                  name
                }
              `),
          }),
        ).toMatchSnapshot();
        done();
      },
    });
  });
});

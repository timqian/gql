/* @flow */
import { code } from '../__test-data__/utils';
import path from 'path';
import { createTempFiles } from '../shared/test-utils';
import { GQLService } from '../GQLService';

test('findRefs should return all references of token at given position', (done) => {
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
      done();
    },
  });
});

test('should not throw if called before onInit', () => {
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

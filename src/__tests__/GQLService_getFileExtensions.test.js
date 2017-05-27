/* @flow */
/* eslint-disable max-len */
import { createTempFiles } from '../shared/test-utils';
import { GQLService } from '../GQLService';

test('correctly find all file extensions used in .gqlconfig', (done) => {
  const dir = createTempFiles({
    '.gqlconfig': `
      {
        schema: {
          files: 'schema/*.gql',
        },
        query: {
          files: [
            {
              match: 'query/*.graphql',
              parser: 'QueryParser',
            },
            {
              match: 'query/*.js',
              parser: 'QueryParser',
            },
            {
              match: 'query/*.xyz',
              parser: 'QueryParser',
            },
          ]
        }
      }
    `,
    'schema/schema.gql': `
      type Query {
        name: string
      }
    `,
  });
  const gql = new GQLService({
    cwd: dir,
    watch: false,
    onInit() {
      expect(gql.getFileExtensions()).toMatchSnapshot();
      done();
    },
  });
});

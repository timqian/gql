/* @flow */
import { createTempFiles } from 'gql-test-utils/file';
import { dedent } from 'dentist';
import GQLService from 'gql-service';

async function validateSource(source: string): Promise<any> {
  const gql = new GQLService({
    cwd: createTempFiles({
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
          mutation: Mutation!
        }

        type Viewer {
          me: User!
        }

        type User {
          id: ID!
          name: String
          image(size: Int!): String
        }

        type Mutation {
          UserCreate(input: UserCreateInput): UserCreatePayload
        }

        input UserCreateInput {
          id: ID!
          name: String!
        }

        type UserCreatePayload {
          userID: ID!
          viewer: Viewer!
        }
      `,

      'query/test.js': dedent(source),
    }),

    watch: false,
  });

  gql.onError(err => {
    throw err;
  });

  await gql.start();

  return gql.status();
}

test('ExactlyOneOperation', async () => {
  const errors = await validateSource(`
    graphql\`
      query ExampleQuery {
        viewer {
          ...ComponentViewer
        }
      }

      fragment viewer on Viewer {
        me {
          name
        }
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

test('[NoSchemaDefinition]', async () => {
  const errors = await validateSource(`
    graphql\`
      type Tester {
        id: ID!
      }
    \`
  `);
  expect(errors).toMatchSnapshot();
});

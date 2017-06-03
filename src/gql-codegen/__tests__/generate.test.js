/* @flow */
import path from 'path';
import { createTempFiles } from 'gql-test-utils/file';
import { mkdirpSync } from 'gql-shared/fs-utils';
import generate from '../generate';
import fs from 'fs';

test('generate: schemaJSON', async () => {
  const content = await generate({
    configOptions: {
      cwd: path.resolve(__dirname, './fixtures/sample-project/'),
    },
    targets: [
      { type: 'schemaFlow' },
      { type: 'schemaGQL' },
      { type: 'schemaJSON' },
    ],
  });

  expect(content).toMatchSnapshot();
});

test('generate: directly output to files', async () => {
  const dir = createTempFiles({
    '.gqlconfig': `
      {
        schema: {
          files: 'schema/*.gql'
        }
      }
    `,
    'schema/schema.gql': `
      type Query {
        player: Player
      }

      type Player {
        id: String
        name: String
      }
    `,
  });

  const generatedFilesDir = path.join(dir, 'generated');
  mkdirpSync(generatedFilesDir);

  const schemaFlowPath = path.join(generatedFilesDir, 'schema.flow');
  const schemaGQLPath = path.join(generatedFilesDir, 'schema.gql');
  const schemaJSONPath = path.join(generatedFilesDir, 'schema.json');

  await generate({
    configOptions: {
      cwd: dir,
    },
    targets: [
      { type: 'schemaFlow', outputPath: schemaFlowPath },
      { type: 'schemaGQL', outputPath: schemaGQLPath },
      { type: 'schemaJSON', outputPath: schemaJSONPath },
    ],
  });

  const schemaFlow = fs.readFileSync(schemaFlowPath, 'utf8');
  const schemaGQL = fs.readFileSync(schemaGQLPath, 'utf8');
  const schemaJSON = fs.readFileSync(schemaJSONPath, 'utf8');

  expect(schemaFlow).toMatchSnapshot();
  expect(schemaGQL).toMatchSnapshot();
  expect(schemaJSON).toMatchSnapshot();
});

test('generate: should handle graphql parse errors', async () => {
  await expect(
    generate({
      configOptions: {
        cwd: path.resolve(__dirname, './fixtures/error-sample-project/'),
      },
      targets: [{ type: 'schemaJSON' }],
    }),
  ).rejects.toMatchSnapshot();
});

test('generate: should report error for invalid type value', async () => {
  await expect(
    generate({
      configOptions: {
        cwd: path.resolve(__dirname, './fixtures/sample-project/'),
      },
      targets: [{ type: 'schemaXJSON' }],
    }),
  ).rejects.toMatchSnapshot();
});

/* @flow */
import path from 'path';
import { createTempFiles } from '../../shared/test-utils';
import { mkdirpSync } from '../../shared/fs-utils';
import generate from '../generate';
import fs from 'fs';

test('generate: schemaJSON', (done) => {
  generate({
    configOptions: {
      cwd: path.resolve(__dirname, './fixtures/sample-project/'),
    },
    targets: [{ type: 'schemaFlow' }, { type: 'schemaGQL' }, { type: 'schemaJSON' }],
    callback: (err, content) => {
      if (err) {
        done.fail(err);
        return;
      }
      expect(content).toMatchSnapshot();
      done();
    },
  });
});

test('generate: directly output to files', (done) => {
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

  generate({
    configOptions: {
      cwd: dir,
    },
    targets: [
      { type: 'schemaFlow', outputPath: schemaFlowPath },
      { type: 'schemaGQL', outputPath: schemaGQLPath },
      { type: 'schemaJSON', outputPath: schemaJSONPath },
    ],
    callback: (err) => {
      if (err) {
        done.fail(err);
        return;
      }
      const schemaFlow = fs.readFileSync(schemaFlowPath, 'utf8');
      const schemaGQL = fs.readFileSync(schemaGQLPath, 'utf8');
      const schemaJSON = fs.readFileSync(schemaJSONPath, 'utf8');

      expect(schemaFlow).toMatchSnapshot();
      expect(schemaGQL).toMatchSnapshot();
      expect(schemaJSON).toMatchSnapshot();

      done();
    },
  });
});

test('generate: should handle graphql parse errors', (done) => {
  generate({
    configOptions: {
      cwd: path.resolve(__dirname, './fixtures/error-sample-project/'),
    },
    targets: [{ type: 'schemaJSON' }],
    callback: (err) => {
      expect(err).toMatchSnapshot();
      done();
    },
  });
});

test('generate: should report error for invalid type value', (done) => {
  generate({
    configOptions: {
      cwd: path.resolve(__dirname, './fixtures/sample-project/'),
    },
    targets: [{ type: 'schemaXJSON' }],
    callback: (err) => {
      expect(err).toMatchSnapshot();
      done();
    },
  });
});


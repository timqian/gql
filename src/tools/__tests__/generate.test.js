/* @flow */
import path from 'path';

test('generate: schemaJSON', (done) => {
  const generate = require('../generate').default;

  generate({
    configOptions: {
      cwd: path.resolve(__dirname, './fixtures/sample-project/'),
    },
    targets: [
      { type: 'schemaFlow' },
      { type: 'schemaGQL' },
      { type: 'schemaJSON' },
    ],
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

test('generate: should handle graphql parse errors', (done) => {
  const generate = require('../generate').default;

  generate({
    configOptions: {
      cwd: path.resolve(__dirname, './fixtures/error-sample-project/'),
    },
    targets: [
      { type: 'schemaJSON' },
    ],
    callback: (err) => {
      expect(err).toMatchSnapshot();
      done();
    },
  });
});


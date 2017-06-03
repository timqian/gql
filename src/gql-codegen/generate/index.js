/* @flow */
import GQLWatcher from 'gql-watcher';
import invariant from 'invariant';

import GQLConfig from 'gql-config';
import GQLSchemaService from 'gql-schema-service';

import generateFlowTypes from './generateFlowTypes';
import generateSchemaJSON from './generateSchemaJSON';
import generateSchemaGQL from './generateSchemaGQL';

import fs from 'fs';

type Target = {
  type: 'schemaFlow' | 'schemaJSON' | 'schemaGQL',
  outputPath?: string, // if true will write to disk also
};

type Params = {
  configOptions: { cwd: string },
  targets: Array<Target>,
  emit?: boolean, // default true
};

async function generateFile(schema, target) {
  let content = '';
  switch (target.type) {
    case 'schemaFlow':
      content = await generateFlowTypes(schema);
      break;
    case 'schemaJSON':
      content = await generateSchemaJSON(schema);
      break;
    case 'schemaGQL':
      content = await generateSchemaGQL(schema);
      break;
    default:
      invariant(
        false,
        `expecting type to be oneof ['schemaFlow', 'schemaJSON', 'schemaGQL'] but got '${target.type}'.`,
      );
  }
  if (target.outputPath) {
    fs.writeFileSync(target.outputPath, content);
  }
  return content;
}

async function generate(params: Params): Promise<any> {
  const schemaService = new GQLSchemaService({
    config: new GQLConfig(params.configOptions),
    watcher: new GQLWatcher({ watch: false }),
  });

  schemaService.onError(err => {
    throw err;
  });

  // start service
  await schemaService.start();

  const schema = schemaService.getGraphQLSchema();
  const targetContent = await Promise.all(
    params.targets.map(target => generateFile(schema, target)),
  );

  return targetContent;
}

export default generate;

/* @flow */
import GQLConfig, { type GQLConfigOptions } from '../../config/GQLConfig';
import GQLWatcher from '../../shared/GQLWatcher';
import invariant from 'invariant';

import { SchemaManager } from '../../schema';

import generateFlowTypes from './generateFlowTypes';
import generateSchemaJSON from './generateSchemaJSON';
import generateSchemaGQL from './generateSchemaGQL';

import fs from 'fs';

type Target = {
  type: 'schemaFlow' | 'schemaJSON' | 'schemaGQL',
  outputPath?: string, // if true will write to disk also
};

type Params = {
  configOptions: GQLConfigOptions,
  targets: Array<Target>,
  emit?: boolean, // default true
  callback?: () => void,
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

function generate(params: Params) {
  const schemaBuilder = new SchemaManager({
    config: new GQLConfig(params.configOptions),
    watcher: new GQLWatcher({ watch: false }),
  });

  schemaBuilder.onInit(async () => {
    try {
      const schema = schemaBuilder.getGraphQLSchema();
      const targetContent = await Promise.all(
        params.targets.map((target) => generateFile(schema, target)),
      );
      if (params.callback) {
        params.callback(null, targetContent);
      }
    } catch (err) {
      if (params.callback) {
        params.callback(err, null);
      }
    }
  });
}

export default generate;

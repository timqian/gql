#! /usr/bin/env node
/* @flow */
import yargs from 'yargs';
import GQLService from 'gql-service';
import formatter from './formatter';

yargs
  .usage('GQL Command-Line Interface.\nUsage: $0 [command]')
  .help('h')
  .alias('h', 'help')
  .command({
    command: 'check',
    desc: 'Check all files for errors.',
    builder: cmdYargs => {
      cmdYargs
        .option('ignore-query', {
          default: false,
          desc: 'Ignore errors from query',
        })
        .option('ignore-schema', {
          default: false,
          desc: 'Ingore errors from schema',
        });
    },
    handler: args => {
      try {
        const gqlService = new GQLService({ cwd: process.cwd() });
        gqlService.start().then(
          () => {
            const errors = gqlService.status();
            process.stdout.write(formatter(errors));
            gqlService.stop();
            process.exit(errors.length > 0 ? 1 : 0);
          },
          err => {
            console.log(err);
            process.exit(1);
          },
        );
      } catch (err) {
        process.stdout.write(err.message);
        process.exit(1);
      }
    },
  }).argv;

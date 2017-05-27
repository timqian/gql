/* @flow */
import { TEST_TEMP_DIR } from '../src/shared/test-utils';
import { execSync } from 'child_process';

execSync(`rm -rf ${TEST_TEMP_DIR}`);

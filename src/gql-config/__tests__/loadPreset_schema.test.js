/* @flow */
import { loadSchemaPreset } from '../loadPreset';

describe('core-preset', () => {
  ['gql-schema-preset-default'].forEach(preset => {
    test(`should load presetironment when preset=${preset}`, () => {
      expect(loadSchemaPreset(preset, '')).toBeDefined();
    });
  });

  describe('allow package without `gql-query-preset` prefix', () => {
    ['default'].forEach(preset => {
      test(`should load presetironment when preset=${preset}`, () => {
        expect(loadSchemaPreset(preset, '')).toBeDefined();
      });
    });
  });
});

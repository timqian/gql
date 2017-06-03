/* @flow */
/* @babel-flow-runtime-enable */
export type WatchFile = $Exact<{
  name: string,
  exists: boolean,
}>;

export type AbsoluteFilePath = string;

export type Line = number; // (starts from 1)
export type Column = number; // (starts from 1)
export type GQLPosition = { line: Line, column: Column };
export type GQLLocation = {
  start: GQLPosition,
  end: GQLPosition,
  path: AbsoluteFilePath,
};

export type TokenState = {
  kind: string,
  name: string,
  step: number,
  prevState: TokenState,
  type?: string,
  jsInlineFragment?: ?{ count: number },
};

export type Token = {
  start: number,
  end: number,
  string: string,
  state: TokenState,
  style: string,
  prevChar: string,
};

export type Stream = any;

export interface IParser {
  options: Object;
  // eslint-disable-line
  startState(): TokenState;
  token(stream: Stream, state: TokenState): string;
}

export type GQLHint = $Exact<{
  text: string,
  type?: string,
  description?: ?string,
}>;

export type GQLInfo = {
  contents: string | Array<string>,
  // description: string,
};

// validation
import { ValidationContext } from 'graphql/validation/validate';
export type ValidationRule = (context: ValidationContext) => any;
export type ValidationRulesPackage = {
  rules: { [name: string]: ValidationRule },
  config: {
    [ruleName: string]: 'off' | 'warn' | 'error',
  },
};

export type ValidationConfig = {
  rules?: {
    [ruleName: string]: 'off' | 'warn' | 'error',
  },
};

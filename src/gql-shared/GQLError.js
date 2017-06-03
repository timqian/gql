/* @flow */
import { GraphQLError } from 'graphql/error';
import { type AbsoluteFilePath, type Line, type Column } from './types';
import keymirror from 'keymirror';

export const SEVERITY = keymirror({
  error: null,
  warn: null,
});
export type GQLErrorSeverity = $Keys<typeof SEVERITY>;

export type GQLErrorLocation = {
  // NOTE: graphql all line, column startsWith 1 (not zero)
  line: Line,
  column: Column,
  path: AbsoluteFilePath,
};

export type GQLError = {
  message: string,
  severity: GQLErrorSeverity,
  // if locations is missing then error is not in single file
  // e.g Schema needs 'query' defined in some file
  locations: ?Array<GQLErrorLocation>,
};

function patchLocation({ line, column }, source): GQLErrorLocation {
  return {
    line,
    column,
    path: source.name,
  };
}

function cleanMessage(message) {
  const matches = /Syntax Error .+ \(\d+:\d+\) (.+)/.exec(message);
  if (matches) {
    return `Syntax Error: ${matches[1]}`;
  }
  return message;
}

// NOTE: patched error locations to add file path
function patchLocationsUsingNodes(locations, nodes): Array<GQLErrorLocation> {
  const errorNodes = nodes.filter(node => node.loc);
  if (locations) {
    return locations.reduce((acc, location, index) => {
      const errorNode = errorNodes[index];
      if (errorNode.loc) {
        acc.push(patchLocation(location, errorNode.loc.source));
      }
      return acc;
    }, []);
  }
  return [];
}

function patchLocationsUsingSource(locations, source): Array<GQLErrorLocation> {
  return locations.map(({ line, column }) =>
    patchLocation({ line, column }, source),
  );
}

function patchLocations(error: GraphQLError) {
  let locations = null;
  if (error.nodes && error.nodes.length > 0) {
    // NOTE: here nodes can be in differenct files
    locations = patchLocationsUsingNodes(error.locations, error.nodes);
  } else if (error.source && error.locations) {
    // lexer errors doesnt contains node
    locations = patchLocationsUsingSource(error.locations, error.source);
  }
  return locations;
}

export function toGQLError(
  error: GraphQLError,
  severity: GQLErrorSeverity,
): GQLError {
  return {
    message: cleanMessage(error.message),
    locations: patchLocations(error),
    severity,
  };
}

export function newGQLError(
  message: string,
  nodes: ?Array<*>,
  severity: GQLErrorSeverity,
) {
  const error = new GraphQLError(message, nodes);
  return toGQLError(error, severity);
}

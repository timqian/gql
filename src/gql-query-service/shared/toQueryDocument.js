/* @flow */
import { Source } from 'graphql/language/source';
import whileSafe from 'gql-shared/whileSafe';
import debug from 'gql-shared/debug';
import { type IParser } from 'gql-shared/types';
import MultilineCharacterStream from 'gql-shared/MultilineCharacterStream';
import { EmbeddedLanguageParser } from 'gql-shared/EmbeddedLanguageParser';
import invariant from 'invariant';

const IRREGULAR_WHITESPACE =
  '\f\v\u0085\u00A0\ufeff\u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u202f\u205f\u3000';

const whiteSpaceString = text =>
  text.replace(new RegExp(`[\\S${IRREGULAR_WHITESPACE}]`, 'g'), ' ');

function placeholderFragment(text: string) {
  const fragmentName = 'F'; // dummy frag name
  const str = text.replace(/[^\s]/g, ',');
  const fragmentStr = `...${fragmentName}`;
  if (/^.{2}\n/.test(str)) {
    // ${
    //    fragment
    //  }
    return str.replace(/^.{2}/, fragmentStr);
  }
  return str.replace(new RegExp(`^.{${fragmentStr.length}}`), fragmentStr);
}

export default function toQueryDocument(
  source: Source,
  parser: IParser,
): Array<string> {
  debug.time('toQueryDocument');
  const state = parser.startState();

  const stream = new MultilineCharacterStream(source.body);
  const isEmbeddedMode = parser instanceof EmbeddedLanguageParser;
  const queryDocuments = [];
  let activeQueryDocument = isEmbeddedMode ? null : ''; // using null in embedded to differentiate b/w no tag vs empty tag query

  whileSafe(
    {
      condition: () => stream.getCurrentPosition() < source.body.length,
      call: () => {
        const style = parser.token(stream, state);
        // console.log('current', `[${stream.current()}]`, style);

        if (isEmbeddedMode && style === 'ws-empty') {
          return;
        }

        if (isEmbeddedMode && style === 'ws-start') {
          // NOTE: each document should retain the position
          // so should prepend with all previous string
          const emptyPreviousDocument =
            queryDocuments.length > 0
              ? whiteSpaceString(queryDocuments[queryDocuments.length - 1])
              : '';

          activeQueryDocument =
            emptyPreviousDocument + whiteSpaceString(stream.current());
          return;
        }

        if (activeQueryDocument === null) {
          // Somethings is wrong
          invariant(false, 'activeQueryDocument should not be null here');
        }

        // embedded documents
        if (isEmbeddedMode && style === 'ws-end') {
          activeQueryDocument += whiteSpaceString(stream.current());
          queryDocuments.push(activeQueryDocument);
          // reset
          activeQueryDocument = null;
          return;
        }

        if (style === 'ws-2') {
          activeQueryDocument += whiteSpaceString(stream.current());
          return;
        }

        if (
          // add fragment name is missing
          parser.options.allowFragmentWithoutName &&
          state.kind === 'TypeCondition' &&
          state.prevState.kind === 'FragmentDefinition' &&
          stream.current() === 'on' &&
          !state.prevState.name
        ) {
          activeQueryDocument += '_ on';
          return;
        }

        if (style === 'js-frag') {
          activeQueryDocument += placeholderFragment(stream.current());
          return;
        }

        if (style) {
          activeQueryDocument += stream.current();
        }
      },
    },
    source.body.length,
  );

  if (activeQueryDocument !== null) {
    queryDocuments.push(activeQueryDocument);
  }

  debug.timeEnd('toQueryDocument');
  // console.log(queryDocuments);
  return queryDocuments;
}

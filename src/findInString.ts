import { compact, isString } from "lodash";
// @ts-ignore
import toRegex from "to-regex";
import {Match} from "./match";


export const findInString = (path: string, needle: RegExp | string, haystack: string): Match[] => {
    const re = isString(needle) ? toRegex(needle, {contains: true} ) : needle;
    const lines = haystack.split(/\r?\n/);
    return compact(lines.map(function (line, i) {
      if (re.test(line)) {
        const matches = line.match(re) || [];
        const match = matches[0];
        const retval: Match = {
          line: line,
          number: i + 1,
          match,
          path,
        };
        return retval;
      }
    }));
  };


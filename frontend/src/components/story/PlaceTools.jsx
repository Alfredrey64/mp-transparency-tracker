/** @jsxImportSource react */
import { useId } from "react";
import "../../placetools.css";

// The row above a list of places near the visitor: a search by name, a choice of order, and (as children) any filters the list has. Every list starts nearest first. `line` is the
// sentence under it saying how many are showing and in what order; it is announced politely when it changes so the result of a search is not silent.
export default function PlaceTools({ label, query, onQuery, sort, onSort, sorts, line, children }) {
  const id = useId();
  return (
    <div className="plt-tools" role="group" aria-label={label}>
      <div className="plt-row">
        <div className="plt-field plt-search">
          <label htmlFor={`${id}-q`}>Search by name</label>
          <input id={`${id}-q`} type="search" value={query} onChange={(e) => onQuery(e.target.value)} placeholder="A name, street or postcode" autoComplete="off" spellCheck="false" />
        </div>
        <div className="plt-field plt-sort">
          <label htmlFor={`${id}-s`}>Sort by</label>
          <select id={`${id}-s`} value={sort} onChange={(e) => onSort(e.target.value)}>
            {sorts.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      </div>
      {children}
      {line && <p className="plt-line" role="status">{line}</p>}
    </div>
  );
}

// Said in place of a list when nothing matches, with a way back.
export function NoMatch({ what, onClear }) {
  return (
    <div className="plt-none">
      <p>No {what} match that. Check the spelling, or try fewer words.</p>
      <button type="button" onClick={onClear}>Clear the search and filters</button>
    </div>
  );
}

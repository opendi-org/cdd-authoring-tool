// Taken from the React Example in the svelte-jsoneditor repo (https://github.com/josdejong/svelte-jsoneditor)
// Example here: https://stackblitz.com/edit/svelte-jsoneditor-in-react
// See license at bottom of this source page

import {
    createJSONEditor,
    JSONEditorPropsOptional,
    JsonEditor,
  } from 'vanilla-jsoneditor';
import { useEffect, useRef } from 'react';

//Additional props outside of the default ones
type SvelteJSONEditorProps = JSONEditorPropsOptional & {
  expandedPaths?: Array<Array<string>>; //2D array of strings -- Array of paths, where paths are arrays of strings.
}


export default function SvelteJSONEditor(props: SvelteJSONEditorProps) {
  const refContainer = useRef<HTMLDivElement | null>(null);
  const refEditor = useRef<JsonEditor | null>(null);
  const refPrevProps = useRef<JSONEditorPropsOptional>(props);

  useEffect(() => {
    // create editor
    refEditor.current = createJSONEditor({
      target: refContainer.current as HTMLDivElement,
      props,
    });

    return () => {
      // destroy editor
      if (refEditor.current) {
        refEditor.current.destroy();
        refEditor.current = null;
      }
    };
  }, []);

  // update props
  useEffect(() => {
    if (refEditor.current) {
      // only pass the props that actually changed
      // since the last time to prevent syncing issues
      const changedProps = filterUnchangedProps(props, refPrevProps.current);
      refEditor.current.updateProps(changedProps);
      refPrevProps.current = props;
    }
  }, [props]);

  // Update expanded/collapsed sections
  useEffect(() => {
    const editor = refEditor.current;
    const paths = props.expandedPaths;
    if (editor && paths) {
      editor.collapse([], true); //collapse all
      paths.forEach((path) => editor.expand(path, () => true)); //Expand requested paths
      if(paths.length > 0)
      {
        editor.scrollTo(paths[paths.length - 1]); //Scroll to the last path given
      }
    }
  }, [props.expandedPaths])

  return <div className="vanilla-jsoneditor-react" ref={refContainer}></div>;
}

function filterUnchangedProps(
  props: SvelteJSONEditorProps,
  prevProps: SvelteJSONEditorProps
): SvelteJSONEditorProps {
  return Object.fromEntries(
    Object.entries(props)
    .filter(([key]) => key !== "expandedPaths")
    .filter(([key, value]) => value !== prevProps[key as keyof SvelteJSONEditorProps])
  );
}


// === ORIGINAL LICENSE FOR THIS EXAMPLE ===
//
// The ISC License
// 
// Copyright (c) 2020-2024 by Jos de Jong
// 
// Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
// 
// THE SOFTWARE IS PROVIDED "AS IS" AND ISC DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL ISC BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
  
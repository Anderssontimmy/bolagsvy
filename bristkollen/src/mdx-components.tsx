import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ReactNode } from "react";

const lank = "font-semibold text-primar underline";

/** Markerad ruta för saker som är extra viktiga, t.ex. att aldrig hålla inne hyran. */
function Viktigt({ children }: { children: ReactNode }) {
  return (
    <div className="my-8 rounded-2xl border-2 border-glod bg-glod-ljus px-5 py-1 [&_p]:my-3">{children}</div>
  );
}

/** Exempeltext, t.ex. en mall för en anmälan. */
function Mall({ children }: { children: ReactNode }) {
  return (
    <figure className="my-6 rounded-2xl border border-linje bg-yta px-5 py-2 shadow-sm sm:px-7 [&_p]:my-2">
      {children}
    </figure>
  );
}

const components = {
  h2: (props) => <h2 className="mt-12 mb-3 text-2xl font-semibold sm:text-[1.75rem]" {...props} />,
  h3: (props) => <h3 className="mt-8 mb-2 text-xl font-semibold" {...props} />,
  p: (props) => <p className="my-4" {...props} />,
  ul: (props) => <ul className="my-4 list-disc space-y-2 pl-6 marker:text-glod" {...props} />,
  ol: (props) => <ol className="my-4 list-decimal space-y-3 pl-6 marker:font-bold marker:text-glod" {...props} />,
  strong: (props) => <strong className="font-bold" {...props} />,
  a: ({ href = "", children }) =>
    href.startsWith("/") || href.startsWith("#") ? (
      <Link href={href} className={lank}>
        {children}
      </Link>
    ) : (
      <a href={href} className={lank} rel="noopener noreferrer">
        {children}
      </a>
    ),
  Viktigt,
  Mall,
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}

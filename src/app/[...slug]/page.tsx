import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, PAGES } from "@/lib/catalog/pages";
import { ProductPage } from "@/components/pages/product-page";

// Product pages behind the nav (/mcp, /gpt-astra, /generate, /academy, …).
// Static routes elsewhere in app/ take precedence over this catch-all.

export const dynamic = "force-static";

export function generateStaticParams() {
  return PAGES.map((p) => ({ slug: [p.slug] }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(slug[0]);
  return page ? { title: page.nav, description: page.tagline } : { title: "Not found" };
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = getPage(slug[0]);
  if (!page) notFound();
  return <ProductPage page={page} />;
}

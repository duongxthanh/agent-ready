export interface PostalAddress {
  street?: string;
  locality?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

export interface JsonLdOptions {
  type: string;
  name: string;
  url?: string;
  description?: string;
  telephone?: string;
  priceRange?: string;
  image?: string;
  address?: PostalAddress;
  geo?: { lat: number; lng: number };
  openingHours?: string[];
}

function buildAddress(a: PostalAddress): Record<string, unknown> | null {
  const out: Record<string, unknown> = { '@type': 'PostalAddress' };
  if (a.street) out.streetAddress = a.street;
  if (a.locality) out.addressLocality = a.locality;
  if (a.region) out.addressRegion = a.region;
  if (a.postalCode) out.postalCode = a.postalCode;
  if (a.country) out.addressCountry = a.country;
  return Object.keys(out).length > 1 ? out : null;
}

export function generateJsonLd(o: JsonLdOptions): string {
  const data: Record<string, unknown> = { '@context': 'https://schema.org', '@type': o.type, name: o.name };
  if (o.url) data.url = o.url;
  if (o.description) data.description = o.description;
  if (o.telephone) data.telephone = o.telephone;
  if (o.priceRange) data.priceRange = o.priceRange;
  if (o.image) data.image = o.image;
  if (o.address) {
    const addr = buildAddress(o.address);
    if (addr) data.address = addr;
  }
  if (o.geo) data.geo = { '@type': 'GeoCoordinates', latitude: o.geo.lat, longitude: o.geo.lng };
  if (o.openingHours?.length) data.openingHours = o.openingHours.map((h) => h.replace(/[\r\n]/g, ''));

  const json = JSON.stringify(data, null, 2)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  return `<script type="application/ld+json">${json}</script>`;
}

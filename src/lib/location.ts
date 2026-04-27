function cleanLocationPart(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function formatCityLocation({
  locality,
  city,
  principalSubdivision,
  countryName,
}: {
  locality?: string | null;
  city?: string | null;
  principalSubdivision?: string | null;
  countryName?: string | null;
}) {
  const parts = [
    cleanLocationPart(locality) ?? cleanLocationPart(city),
    cleanLocationPart(principalSubdivision),
    cleanLocationPart(countryName),
  ];
  const uniqueParts = parts.filter((part, index) => {
    if (!part) {
      return false;
    }
    return parts.findIndex((candidate) => candidate === part) === index;
  });

  return uniqueParts.slice(0, 2).join("，") || null;
}

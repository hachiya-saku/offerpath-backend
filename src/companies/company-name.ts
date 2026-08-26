export const normalizeCompanyName = (name: string): string => {
  return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
};

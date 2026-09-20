export type Orchestra = {
  id: string;
  name: string;
  city: string;
  country: string;
  website?: string;
};

export const orchestras: Orchestra[] = [
  {
    id: "vienna-philharmonic",
    name: "Vienna Philharmonic",
    city: "Vienna",
    country: "Austria",
    website: "#",
  },
  {
    id: "berlin-philharmonic",
    name: "Berlin Philharmonic",
    city: "Berlin",
    country: "Germany",
    website: "#",
  },
  {
    id: "royal-concertgebouw-orchestra",
    name: "Royal Concertgebouw Orchestra",
    city: "Amsterdam",
    country: "Netherlands",
    website: "#",
  },
];

export function getOrchestra(id: string): Orchestra | undefined {
  return orchestras.find((orchestra) => orchestra.id === id);
}
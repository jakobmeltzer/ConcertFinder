export type Venue = {
  id: string;
  name: string;
  address?: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  website?: string;
};

export const venues: Venue[] = [
  {
    id: "musikverein-vienna",
    name: "Musikverein",
    address: "Musikvereinsplatz 1",
    city: "Vienna",
    country: "Austria",
    website: "#",
  },
  {
    id: "berliner-philharmonie",
    name: "Berliner Philharmonie",
    address: "Herbert-von-Karajan-Straße 1",
    city: "Berlin",
    country: "Germany",
    website: "#",
  },
  {
    id: "concertgebouw-amsterdam",
    name: "Concertgebouw",
    address: "Concertgebouwplein 10",
    city: "Amsterdam",
    country: "Netherlands",
    website: "#",
  },
];

export function getVenue(id: string): Venue | undefined {
  return venues.find((venue) => venue.id === id);
}
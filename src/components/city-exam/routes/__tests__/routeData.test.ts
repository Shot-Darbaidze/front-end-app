import { CITIES, getCityRoutes } from "../routeData";

describe("routeData", () => {
  it("matches the latest official route totals for cities that changed", () => {
    const telavi = CITIES.find((city) => city.id === "telavi");
    const sachkhere = CITIES.find((city) => city.id === "sachkhere");
    const batumi = CITIES.find((city) => city.id === "batumi");
    const poti = CITIES.find((city) => city.id === "poti");

    expect(telavi?.routeNumbers).toHaveLength(23);
    expect(sachkhere?.routeNumbers).toHaveLength(7);
    expect(batumi?.routeNumbers).toHaveLength(3);
    expect(poti?.routeNumbers).toEqual([1, 2, 3, 6]);
  });

  it("builds the route list from explicit route numbers instead of 1..n", () => {
    const poti = CITIES.find((city) => city.id === "poti");

    expect(poti).toBeDefined();
    expect(getCityRoutes(poti!)).toEqual([
      { routeNumber: 1, video: null },
      { routeNumber: 2, video: null },
      { routeNumber: 3, video: null },
      { routeNumber: 6, video: null },
    ]);
  });
});

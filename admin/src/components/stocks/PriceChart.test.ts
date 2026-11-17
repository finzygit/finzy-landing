// MOB-1487: the price lines on the right of the stock chart never repeat a
// label: a narrow range (a month of a $68 stock) gets the decimals it needs.
import { describe, expect, it } from "vitest";
import { axisLabels } from "./PriceChart";

describe("price axis labels", () => {
  it("adds decimals until the five labels differ", () => {
    expect(axisLabels([69.1, 68.6, 68.1, 67.6, 67.1])).toEqual(["$69,1", "$68,6", "$68,1", "$67,6", "$67,1"]);
    expect(axisLabels([12.31, 12.26, 12.21, 12.16, 12.11])).toEqual(["$12,31", "$12,26", "$12,21", "$12,16", "$12,11"]);
  });

  it("keeps whole dollars when they already differ", () => {
    expect(axisLabels([234, 219, 204, 189, 174])).toEqual(["$234", "$219", "$204", "$189", "$174"]);
  });

  it("goes to four decimals for a currency pair in a narrow range", () => {
    expect(axisLabels([1.17, 1.164, 1.158, 1.152, 1.146])).toEqual(["$1,170", "$1,164", "$1,158", "$1,152", "$1,146"]);
    expect(axisLabels([1.1612, 1.1609, 1.1606, 1.1603, 1.16])).toEqual(["$1,1612", "$1,1609", "$1,1606", "$1,1603", "$1,1600"]);
  });

  it("keeps two decimals under $10", () => {
    expect(axisLabels([4.5, 4, 3.5, 3, 2.5])).toEqual(["$4,50", "$4,00", "$3,50", "$3,00", "$2,50"]);
  });
});

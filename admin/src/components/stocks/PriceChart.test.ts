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

  it("keeps two decimals under $10", () => {
    expect(axisLabels([4.5, 4, 3.5, 3, 2.5])).toEqual(["$4,50", "$4,00", "$3,50", "$3,00", "$2,50"]);
  });
});

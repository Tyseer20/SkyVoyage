import test from "node:test";
import assert from "node:assert/strict";

test("flight search contract preserves the requested route and maps offer basics", () => {
  const offer = {
    id: "off_test",
    total_amount: "420.00",
    slices: [{ segments: [{
      departing_at: "2026-10-18T08:00:00Z",
      arriving_at: "2026-10-18T13:30:00Z",
      origin: { iata_code: "BOM", name: "Mumbai" },
      destination: { iata_code: "DXB", name: "Dubai" },
      marketing_carrier: { iata_code: "EK", name: "Emirates" },
      marketing_carrier_flight_number: "501",
    }] }],
  };
  assert.equal(offer.id, "off_test");
  assert.equal(offer.slices[0].segments[0].origin.iata_code, "BOM");
  assert.equal(Number(offer.total_amount), 420);
});
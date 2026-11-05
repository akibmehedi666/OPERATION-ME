import { describe, it, expect } from "vitest";
import { getRankFromXp } from "../rank";

describe("rank - security clearance calculation", () => {
  it("determines Recruit for XP between 0 and 249", () => {
    const res0 = getRankFromXp(0);
    expect(res0.rank).toBe("Recruit");
    expect(res0.progress).toBe(0);
    expect(res0.xpToNext).toBe(250);

    const res125 = getRankFromXp(125);
    expect(res125.rank).toBe("Recruit");
    expect(res125.progress).toBe(50);
    expect(res125.xpToNext).toBe(125);
  });

  it("determines Field Agent for XP between 250 and 999", () => {
    const res250 = getRankFromXp(250);
    expect(res250.rank).toBe("Field Agent");
    expect(res250.progress).toBe(0);
    expect(res250.xpToNext).toBe(750);

    const res350 = getRankFromXp(350);
    expect(res350.rank).toBe("Field Agent");
    expect(res350.progress).toBe(Math.round((100 / 750) * 100)); // 13%
    expect(res350.xpToNext).toBe(650);
  });

  it("determines Elite for XP between 1000 and 2499", () => {
    const res1000 = getRankFromXp(1000);
    expect(res1000.rank).toBe("Elite");
    expect(res1000.progress).toBe(0);
    expect(res1000.xpToNext).toBe(1500);
  });

  it("determines Director for XP >= 2500 and caps progress at 100%", () => {
    const res2500 = getRankFromXp(2500);
    expect(res2500.rank).toBe("Director");
    expect(res2500.progress).toBe(100);
    expect(res2500.xpToNext).toBe(0);

    const res5000 = getRankFromXp(5000);
    expect(res5000.rank).toBe("Director");
    expect(res5000.progress).toBe(100);
    expect(res5000.xpToNext).toBe(0);
  });
});

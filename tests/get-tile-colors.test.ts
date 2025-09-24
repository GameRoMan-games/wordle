import { getTileColors } from "~/lib/get-tile-colors"; // Assuming the helper is exported or you have a way to access it for testing
import type { TileColor } from "~/types"; // Import your types

describe("getTileColors", () => {
  // Mock CONFIG for testing purposes
  const CONFIG = { wordLength: 5 };

  // Test case 1: All correct letters (green)
  test("should return all green for a perfect match", () => {
    const guess = "rebus";
    const secret = "rebus";
    const expectedColors: TileColor[] = [
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
    ];
    expect(getTileColors(guess, secret)).toEqual(expectedColors);
  });

  // Test case 2: Correctly handle duplicate letters (the original bug)
  test("should color the second duplicate letter as green and the first as absent or yellow", () => {
    const guess = "songs";
    const secret = "rebus";
    // 's' is present but at a different spot. The first 's' should be yellow, second should be green.
    // The bug was marking the first 's' as yellow. This should now be absent.
    const expectedColors: TileColor[] = [
      "absent",
      "absent",
      "absent",
      "absent",
      "correct",
    ];
    expect(getTileColors(guess, secret)).toEqual(expectedColors);
  });

  // Test case 3: Handle duplicate letters in the guess
  test("should correctly color duplicate letters in the guess with one present in the secret", () => {
    const guess = "apple";
    const secret = "grape";
    const expectedColors: TileColor[] = [
      "absent",
      "present",
      "absent",
      "present",
      "absent",
    ];
    // 'a' is absent, the first 'p' is present, second 'p' is absent, 'l' is absent, 'e' is absent
    expect(getTileColors(guess, secret)).toEqual(expectedColors);
  });

  // Test case 4: All letters are present but in wrong spots (yellow)
  test("should return all yellow for all present but misplaced letters", () => {
    const guess = "abcef";
    const secret = "fceba";
    const expectedColors: TileColor[] = [
      "present",
      "present",
      "present",
      "present",
      "present",
    ];
    expect(getTileColors(guess, secret)).toEqual(expectedColors);
  });

  // Test case 5: All letters are absent (gray)
  test("should return all absent for no matching letters", () => {
    const guess = "power";
    const secret = "dread";
    const expectedColors: TileColor[] = [
      "absent",
      "absent",
      "absent",
      "absent",
      "absent",
    ];
    expect(getTileColors(guess, secret)).toEqual(expectedColors);
  });
});

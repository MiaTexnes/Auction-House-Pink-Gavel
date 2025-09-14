# Simple Vitest Testing Guide

## Running Tests

```bash
# Run tests once
npm run test:run

# Run tests and watch for changes
npm run test

# See test coverage
npm run test:coverage
```

## Writing Your First Test

Create a file ending in `.test.js` in the `src/tests/` folder:

```javascript
import { describe, it, expect } from "vitest";

describe("My Function", () => {
  it("should work correctly", () => {
    // Your test here
    expect(2 + 2).toBe(4);
  });
});
```

## Common Test Patterns

### Testing Functions

```javascript
import { formatPrice } from "../utils/priceUtils.js";

describe("formatPrice", () => {
  it("should add dollar sign and decimals", () => {
    expect(formatPrice(10)).toBe("$10.00");
  });
});
```

### Testing DOM Elements

```javascript
describe("Button", () => {
  it("should create a button with text", () => {
    const button = document.createElement("button");
    button.textContent = "Click me";

    expect(button.textContent).toBe("Click me");
  });
});
```

### Testing with Mock Functions

```javascript
import { vi } from "vitest";

describe("Click Handler", () => {
  it("should call function when clicked", () => {
    const mockFn = vi.fn();
    const button = document.createElement("button");

    button.addEventListener("click", mockFn);
    button.click();

    expect(mockFn).toHaveBeenCalled();
  });
});
```

## Useful Expectations

```javascript
// Basic comparisons
expect(value).toBe(4);
expect(text).toBe("hello");

// Objects and arrays
expect(user).toEqual({ name: "John", age: 30 });
expect(numbers).toContain(5);

// True/false checks
expect(isValid).toBeTruthy();
expect(isEmpty).toBeFalsy();

// Function calls (with mocks)
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledWith("argument");
```

## Test Structure Tips

1. **Group related tests** with `describe()`
2. **Use clear test names** that explain what should happen
3. **Follow the pattern**: setup → action → check result

```javascript
describe("Shopping Cart", () => {
  it("should add item to cart", () => {
    // Setup
    const cart = new ShoppingCart();
    const item = { name: "Apple", price: 1.0 };

    // Action
    cart.addItem(item);

    // Check result
    expect(cart.items).toContain(item);
    expect(cart.total).toBe(1.0);
  });
});
```

## Quick Debugging

```javascript
// Skip a test temporarily
it.skip("should do something", () => {
  // This won't run
});

// Run only this test
it.only("should run only this", () => {
  // Only this test runs
});

// Add console.log for debugging
it("should debug", () => {
  console.log("Value:", someValue);
  expect(someValue).toBe(expected);
});
```

## What to Test

Start with these:

- ✅ Functions that calculate or transform data
- ✅ Functions that validate input
- ✅ Button click handlers
- ✅ Form validation
- ✅ API request formatting

Don't worry about testing:

- ❌ Third-party libraries
- ❌ Simple getters/setters
- ❌ Configuration files

## Example: Testing a Simple Function

```javascript
// In src/utils/math.js
export function add(a, b) {
  return a + b;
}

// In src/tests/math.test.js
import { describe, it, expect } from "vitest";
import { add } from "../utils/math.js";

describe("add function", () => {
  it("should add two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("should handle negative numbers", () => {
    expect(add(-1, 1)).toBe(0);
  });
});
```

That's it! Start simple and add more tests as you get comfortable.

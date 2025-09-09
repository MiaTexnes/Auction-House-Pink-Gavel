# Testing with Vitest - Complete Guide

This guide covers how to use Vitest for testing in your Pink Gavel Auctions project.

## 🚀 Quick Start

Your project is already configured with Vitest! Here are the available commands:

```bash
# Run tests once
npm run test:run

# Run tests in watch mode (for development)
npm run test

# Run tests with coverage report
npm run test:coverage
```

## 📁 Test Structure

Tests are organized in the `src/tests/` directory:

```
src/tests/
├── example.test.js       # Basic test examples
├── timeUtils.test.js     # Tests for time utility functions
├── baseApi.test.js       # Tests for API configuration
└── buttons.test.js       # Tests for button components
```

## 🛠️ Configuration

Vitest is configured in `vite.config.js`:

```javascript
test: {
  globals: true,        // Use global test functions (describe, it, expect)
  environment: "jsdom", // DOM environment for testing UI components
}
```

## 📝 Writing Tests

### Basic Test Structure

```javascript
import { describe, it, expect } from "vitest";

describe("Component or Module Name", () => {
  it("should do something specific", () => {
    // Arrange
    const input = "test input";

    // Act
    const result = someFunction(input);

    // Assert
    expect(result).toBe("expected output");
  });
});
```

### Common Test Patterns

#### 1. Testing Pure Functions

```javascript
import { describe, it, expect } from "vitest";
import { formatPrice } from "../utils/priceUtils.js";

describe("formatPrice", () => {
  it("should format price with two decimal places", () => {
    expect(formatPrice(10)).toBe("$10.00");
    expect(formatPrice(9.99)).toBe("$9.99");
  });
});
```

#### 2. Testing DOM Manipulation

```javascript
import { describe, it, expect, beforeEach } from "vitest";

describe("DOM Tests", () => {
  beforeEach(() => {
    document.body.innerHTML = ""; // Reset DOM before each test
  });

  it("should create and append elements", () => {
    const div = document.createElement("div");
    div.textContent = "Test content";
    document.body.appendChild(div);

    expect(document.querySelector("div").textContent).toBe("Test content");
  });
});
```

#### 3. Testing with Mocks

```javascript
import { describe, it, expect, vi } from "vitest";

// Mock a module
vi.mock("../services/config.js", () => ({
  config: {
    API_BASE_URL: "https://api.test.com",
  },
}));

describe("API Tests", () => {
  it("should use mocked config", () => {
    // Test will use the mocked config
  });
});
```

#### 4. Testing Event Handlers

```javascript
import { describe, it, expect, vi } from "vitest";

describe("Button Tests", () => {
  it("should handle button clicks", () => {
    const mockHandler = vi.fn();
    const button = document.createElement("button");

    button.addEventListener("click", mockHandler);
    button.click();

    expect(mockHandler).toHaveBeenCalledOnce();
  });
});
```

#### 5. Testing Time-based Functions

```javascript
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Time Tests", () => {
  beforeEach(() => {
    vi.useRealTimers(); // Reset timers before each test
  });

  it("should handle time calculations", () => {
    const mockDate = new Date("2024-01-01T00:00:00Z");
    vi.setSystemTime(mockDate);

    // Your time-based tests here
  });
});
```

## 🧪 Test Examples from Your Project

### 1. Utility Function Testing (timeUtils.test.js)

- Tests time formatting functions
- Uses mocked system time for consistent results
- Tests edge cases like expired auctions

### 2. API Configuration Testing (baseApi.test.js)

- Tests endpoint URL generation
- Uses module mocking for configuration
- Tests with different parameters

### 3. Component Testing (buttons.test.js)

- Tests DOM element creation
- Tests event handling
- Tests CSS class application
- Uses function mocking for callbacks

## 📊 Coverage Reports

Run coverage to see how much of your code is tested:

```bash
npm run test:coverage
```

This generates a detailed report showing:

- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

## 🎯 Best Practices

### 1. Test Organization

- Group related tests with `describe()`
- Use descriptive test names with `it('should...')`
- One assertion per test when possible

### 2. Test Independence

- Use `beforeEach()` to reset state
- Don't rely on test execution order
- Clean up after tests (DOM, mocks, etc.)

### 3. Meaningful Assertions

```javascript
// Good
expect(result.text).toBe("2d 3h 30m");
expect(result.isEnded).toBe(false);

// Less ideal
expect(result).toBeTruthy();
```

### 4. Edge Cases

- Test boundary conditions
- Test error scenarios
- Test empty/null/undefined inputs

### 5. Mocking

- Mock external dependencies
- Mock time-dependent functions
- Mock API calls

## 🔧 Available Matchers

Vitest includes many assertion methods:

```javascript
// Equality
expect(value).toBe(4);
expect(object).toEqual({ name: "test" });

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeCloseTo(0.3);

// Strings
expect("hello world").toContain("world");
expect("hello").toMatch(/ello/);

// Arrays
expect(["a", "b", "c"]).toContain("b");
expect(array).toHaveLength(3);

// Functions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith("arg");
expect(mockFn).toHaveBeenCalledTimes(2);

// DOM
expect(element).toBeInTheDocument();
expect(element).toHaveClass("active");
```

## 🐛 Debugging Tests

### 1. Console Output

```javascript
it("should debug values", () => {
  console.log("Debug info:", someValue);
  expect(someValue).toBe(expectedValue);
});
```

### 2. Skip Tests Temporarily

```javascript
it.skip("should be skipped", () => {
  // This test won't run
});
```

### 3. Run Only Specific Tests

```javascript
it.only("should run only this test", () => {
  // Only this test will run
});
```

## 📈 Next Steps

1. **Add more tests** for your existing modules:
   - `src/services/biddingService.js`
   - `src/components/carousel.js`
   - `src/utils/profileUtils.js`

2. **Test your page modules**:
   - Test form validation
   - Test API interactions
   - Test user flows

3. **Integration tests**:
   - Test multiple components working together
   - Test complete user workflows

4. **E2E tests** (optional):
   - Consider adding Playwright for end-to-end testing

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Jest Matchers (compatible with Vitest)](https://jestjs.io/docs/expect)
- [Testing Library (for more advanced DOM testing)](https://testing-library.com/)

Happy testing! 🎉

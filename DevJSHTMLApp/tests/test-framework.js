class SimpleTestFramework {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentTest = null;
    }

    describe(description, testFunction) {
        console.log(`\n📋 ${description}`);
        console.log('='.repeat(50));
        
        const suite = {
            description: description,
            tests: [],
            beforeEach: null,
            afterEach: null
        };

        const context = {
            beforeEach: (fn) => { suite.beforeEach = fn; },
            afterEach: (fn) => { suite.afterEach = fn; },
            it: (testDescription, testFn) => {
                suite.tests.push({
                    description: testDescription,
                    test: testFn
                });
            }
        };

        testFunction.call(context);
        this.runSuite(suite);
    }

    runSuite(suite) {
        let passed = 0;
        let failed = 0;
        const startTime = Date.now();

        suite.tests.forEach(test => {
            try {
                if (suite.beforeEach) suite.beforeEach();
                
                this.currentTest = test;
                test.test();
                
                console.log(`  ✅ ${test.description}`);
                passed++;
                
                if (suite.afterEach) suite.afterEach();
            } catch (error) {
                console.log(`  ❌ ${test.description}`);
                console.log(`     Error: ${error.message}`);
                if (error.stack) {
                    console.log(`     Stack: ${error.stack.split('\n')[1]?.trim() || 'No stack trace'}`);
                }
                failed++;
            } finally {
                this.currentTest = null;
            }
        });

        const duration = Date.now() - startTime;
        console.log(`\n📊 Results: ${passed} passed, ${failed} failed (${duration}ms)`);
        
        this.results.push({
            suite: suite.description,
            passed: passed,
            failed: failed,
            duration: duration
        });
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
                }
            },
            
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
                }
            },
            
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected truthy value, but got ${JSON.stringify(actual)}`);
                }
            },
            
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected falsy value, but got ${JSON.stringify(actual)}`);
                }
            },
            
            toContain: (expected) => {
                if (Array.isArray(actual)) {
                    if (!actual.includes(expected)) {
                        throw new Error(`Expected array ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`);
                    }
                } else if (typeof actual === 'string') {
                    if (!actual.includes(expected)) {
                        throw new Error(`Expected string "${actual}" to contain "${expected}"`);
                    }
                } else {
                    throw new Error(`Cannot check containment for type ${typeof actual}`);
                }
            },
            
            toHaveLength: (expected) => {
                if (!actual || typeof actual.length !== 'number') {
                    throw new Error(`Expected value with length property, but got ${JSON.stringify(actual)}`);
                }
                if (actual.length !== expected) {
                    throw new Error(`Expected length ${expected}, but got ${actual.length}`);
                }
            },
            
            toThrow: (expectedError) => {
                if (typeof actual !== 'function') {
                    throw new Error(`Expected function, but got ${typeof actual}`);
                }
                
                let threwError = false;
                let actualError = null;
                
                try {
                    actual();
                } catch (error) {
                    threwError = true;
                    actualError = error;
                }
                
                if (!threwError) {
                    throw new Error(`Expected function to throw an error, but it didn't`);
                }
                
                if (expectedError && actualError.message !== expectedError) {
                    throw new Error(`Expected error "${expectedError}", but got "${actualError.message}"`);
                }
            },

            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },

            toBeLessThan: (expected) => {
                if (actual >= expected) {
                    throw new Error(`Expected ${actual} to be less than ${expected}`);
                }
            },

            toBeInstanceOf: (expectedClass) => {
                if (!(actual instanceof expectedClass)) {
                    throw new Error(`Expected instance of ${expectedClass.name}, but got ${actual.constructor.name}`);
                }
            }
        };
    }

    createMock() {
        const mock = {
            calls: [],
            returnValue: undefined,
            implementation: null
        };

        const mockFunction = (...args) => {
            mock.calls.push(args);
            if (mock.implementation) {
                return mock.implementation(...args);
            }
            return mock.returnValue;
        };

        mockFunction.mockReturnValue = (value) => {
            mock.returnValue = value;
            return mockFunction;
        };

        mockFunction.mockImplementation = (fn) => {
            mock.implementation = fn;
            return mockFunction;
        };

        mockFunction.mockClear = () => {
            mock.calls = [];
            return mockFunction;
        };

        mockFunction.toHaveBeenCalled = () => mock.calls.length > 0;
        mockFunction.toHaveBeenCalledTimes = (times) => mock.calls.length === times;
        mockFunction.toHaveBeenCalledWith = (...args) => {
            return mock.calls.some(call => 
                call.length === args.length && 
                call.every((arg, index) => arg === args[index])
            );
        };

        return mockFunction;
    }

    async loadFile(filePath) {
        try {
            const response = await fetch(filePath);
            const text = await response.text();
            return text;
        } catch (error) {
            throw new Error(`Failed to load test file: ${filePath}`);
        }
    }

    async waitFor(conditionFn, timeout = 5000, interval = 100) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (await conditionFn()) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        throw new Error(`Condition not met within ${timeout}ms`);
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    printSummary() {
        console.log('\n🏁 Test Summary');
        console.log('='.repeat(50));
        
        let totalPassed = 0;
        let totalFailed = 0;
        let totalDuration = 0;

        this.results.forEach(result => {
            console.log(`${result.suite}: ${result.passed} passed, ${result.failed} failed (${result.duration}ms)`);
            totalPassed += result.passed;
            totalFailed += result.failed;
            totalDuration += result.duration;
        });

        console.log(`\n📈 Overall: ${totalPassed} passed, ${totalFailed} failed (${totalDuration}ms)`);
        console.log(`${totalFailed === 0 ? '🎉 All tests passed!' : '⚠️ Some tests failed'}`);
        
        return totalFailed === 0;
    }
}

window.TestFramework = SimpleTestFramework;
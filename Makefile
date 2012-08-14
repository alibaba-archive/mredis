TEST = test/*.js
TESTTIMEOUT = 5000
REPORTER = spec 

test:
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter $(REPORTER) --timeout $(TESTTIMEOUT) $(TEST)

test-cov:
	@JSCOV=1 NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter html-cov --timeout $(TESTTIMEOUT) $(TEST) > coverage.html

clean:
	@rm -rf *-cov
	@rm -f coverage.html

.PHONY: test test-cov clean

TEST = test/*.js
TESTTIMEOUT = 5000
REPORTER = spec 

test:
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter $(REPORTER) --timeout $(TESTTIMEOUT) $(TEST)

.PHONY: test
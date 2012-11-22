TEST = test/*.js
TESTTIMEOUT = 5000
REPORTER = spec 
JSCOVER = ./node_modules/.bin/jscover
install:
	@npm install

install-test:
	@NODE_ENV=test npm install -d

test: install-test
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter $(REPORTER) --timeout $(TESTTIMEOUT) $(TEST)

test-cov: install-test lib-cov
	@MREDIS_COV=1 NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter html-cov --timeout $(TESTTIMEOUT) $(TEST) > coverage.html

lib-cov:
	@rm -rf $@
	@$(JSCOVER) lib $@

clean:
	@rm -rf *-cov
	@rm -f coverage.html

.PHONY: test test-cov clean install install-test

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

test-cov: install-test
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter html-cov --require blanket --timeout $(TESTTIMEOUT) $(TEST) > coverage.html 

clean:
	@rm -f coverage.html

.PHONY: test test-cov clean install install-test

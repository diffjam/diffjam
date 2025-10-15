.PHONY:  dist test

clean:
	rm -rf dist
	rm -rf lib

dist: clean
	./publish-executables.sh

prepublish:
	# prepublish targets
	yarn build

lint:
	./node_modules/.bin/eslint '*.js' '**/*.js'

test:
	yarn mocha

ci-diffjam:
	node index.js count --ci

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

integration-test:
	yarn build
	node ./lib/index.js check --dir=./integration_test --config=./integration_test/config.yaml

ci-diffjam:
	DIFFJAM_API_KEY=diffjam-aee11440-d186-11e9-98f6-77c08646740e node index.js count --ci

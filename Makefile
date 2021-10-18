.PHONY:  dist test

clean:
	rm -rf dist

dist: clean
	./publish-executables.sh

prepublish:
	# prepublish targets
	# dist

lint:
	./node_modules/.bin/eslint '*.js' '**/*.js'

test:
	yarn mocha --require ts-node/register 'test/**/*.ts'

ci-diffjam:
	DIFFJAM_API_KEY=diffjam-aee11440-d186-11e9-98f6-77c08646740e node index.js count --ci


build:
	npm run build

# install the genrated min files into the demo project.
# you must heve the demo project checked out in the same directory as this project.
install: build
	cp dist/*  ../ipr-demo/demo/src/js/mco-parser.min.js







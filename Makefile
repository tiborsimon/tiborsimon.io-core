NODE:=./node_modules/.bin/
HIGHLIGHT_STYLE := hopscotch
HIDE:=@

YELLOW:=$(shell tput setaf 3)
RESET:=$(shell tput sgr0)

BASEURL:=http://localhost:8000

.PHONY: all metalsmith css copy apps

all: clean metalsmith copy css apps-build apps-copy

clean:
	cd publish && find . -not -name '.' -not -name '..' -not -name '.git' -print0 | xargs -0 rm -rf

init:
	npm install
	@find apps/* -maxdepth 0 | xargs -I % sh -c 'cd % && $(MAKE) init;'

metalsmith:
	@echo "$(YELLOW)-> Compiling metalsmith..$(RESET)"
	$(HIDE)node metalsmith.js

css:
	@echo "$(YELLOW)-> Compiling CSS..$(RESET)"
	$(HIDE)$(NODE)node-sass scss/main.scss publish/css/compiled.css 1>/dev/null
	$(HIDE)cat ./node_modules/normalize.css/normalize.css \
		         ./node_modules/highlight.js/styles/$(HIGHLIGHT_STYLE).css \
						 ./publish/css/compiled.css > publish/css/style.css
	$(HIDE)cp -a ./node_modules/highlight.js/styles/$(HIGHLIGHT_STYLE).css ./publish/assets/highlight.css

copy:
	@echo "$(YELLOW)-> Copying Assets..$(RESET)"
	$(HIDE)cp -avR ./assets ./publish/assets

apps-build:
	@find apps/* -maxdepth 0 | xargs -I % sh -c 'echo Building % && cd % && $(MAKE) APPPATH=$(BASEURL)/%;'

apps-copy:
	find apps/* -maxdepth 0 | xargs -I % cp -r %/build publish/% 


.PHONY: install test lint syntax clean

install:
	./install.sh

test:
	./tests/run-tests.sh

syntax:
	bash -n install.sh
	bash -n lib/*.sh
	bash -n modules/*.sh
	bash -n tests/*.sh

lint:
	shellcheck -e SC2016 install.sh lib/*.sh modules/*.sh tests/*.sh

clean:
	find . -name "*.tmp" -delete
	find . -name "*.log" -delete

